<?php

namespace App\Http\Controllers;

use Ably\AblyRest;
use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\Post;
use App\Models\User;
use App\Support\PostMentionResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Collection;
use Throwable;

class PostController extends Controller
{
    private const COMMENT_IMAGES_DIR = 'img/comments';

    private function publishFeedEvent(string $channelName, string $eventName, array $data): void
    {
        try {
            $ablyKey = config('services.ably.key');
            if (!$ablyKey) {
                return;
            }

            $ably = new AblyRest($ablyKey);
            $channel = $ably->channels->get($channelName);
            $channel->publish($eventName, $data);
        } catch (Throwable $e) {
            \Log::error('Failed to broadcast feed event via Ably: ' . $e->getMessage());
        }
    }

    /**
     * Broadcast post notification via Ably for real-time updates
     */
    private function broadcastNotification($notification, $sender, $post, $type): void
    {
        try {
            $ablyKey = config('services.ably.key');
            if (!$ablyKey) {
                return;
            }

            $ably = new AblyRest($ablyKey);
            $channel = $ably->channels->get("notifications:{$notification->user_id}");
            
            $message = match($type) {
                'like' => "{$sender->name} liked your post",
                'comment' => "{$sender->name} commented on your post",
                'comment_like' => "{$sender->name} liked your comment",
                'mention' => "{$sender->name} mentioned you in a post",
                default => "{$sender->name} interacted with your post"
            };
            
            $channel->publish('new_notification', [
                'id' => 'post-' . $notification->id,
                'type' => 'post_interaction',
                'sender_name' => $sender->name,
                'sender_image' => $sender->image,
                'message' => $message,
                'link' => '/feed#' . $post->id,
                'icon_type' => 'user',
                'created_at' => $notification->created_at->toISOString(),
                'post_id' => $post->id,
                'interaction_type' => $type,
            ]);
        } catch (Throwable $e) {
            \Log::error('Failed to broadcast notification via Ably: ' . $e->getMessage());
        }
    }

    private function broadcastPostStats(Post $post): void
    {
        // Use cached counts to avoid redundant queries
        $post->loadCount(['likes', 'comments']);
        
        $this->publishFeedEvent('feed:global', 'post-stats-updated', [
            'post_id' => (int) $post->id,
            'likes_count' => (int) $post->likes_count,
            'comments_count' => (int) $post->comments_count,
        ]);
    }

    public function getPostComments($postId)
    {
        $post = Post::findOrFail($postId);
        $userId = Auth::id();

        // Single query with optimized eager loading
        $comments = $post->comments()
            ->with(['user:id,name,image,last_online'])
            ->withCount(['likes'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Get liked comments in single query if user is authenticated
        $likedCommentIds = [];
        if ($userId && Schema::hasTable('comment_likes')) {
            $likedCommentIds = CommentLike::query()
                ->whereIn('comment_id', $comments->pluck('id'))
                ->where('user_id', $userId)
                ->pluck('comment_id')
                ->toArray();
        }

        $formattedComments = $comments->map(function ($comment) use ($likedCommentIds) {
            return [
                'id' => $comment->id,
                'user_id' => $comment->user_id,
                'user_name' => $comment->user->name,
                'user_lastActivity' => $comment->user->last_online,
                'user_image' => $comment->user->image,
                'comment' => $comment->comment,
                'comment_image' => $comment->image,
                'likes_count' => (int) $comment->likes_count,
                'liked' => in_array($comment->id, $likedCommentIds),
                'created_at' => $comment->created_at->toDateTimeString(),
            ];
        });

        return response()->json(['comments' => $formattedComments]);
    }

    public function getPostLikes($postId)
    {
        $post = Post::findOrFail($postId);
        $Likes = $post->likes()
            ->with(['user:id,name,image'])
            ->orderBy('created_at', 'desc')->get()
            ->map(function ($l) {
                return [
                    'id' => $l->id,
                    'user_id' => $l->user_id,
                    'user_name' => $l->user->name,
                    'user_image' => $l->user->image ?? null,
                    'user_status' => $l->user->status,
                    'created_at' => $l->created_at->toDateTimeString(),
                ];
            });
        return response()->json(['likes' => $Likes]);
    }

    public function addPostComment(Request $request, $postId)
    {
        $request->validate([
            'comment' => 'required|string|max:2000',
            'image' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:5120',
        ]);
        $post = Post::findOrFail($postId);
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $storedImage = null;
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            try {
                $disk = $this->postImagesDisk();
                $this->ensurePostImagesDirectoryExists($disk, self::COMMENT_IMAGES_DIR);
                $path = $request->file('image')->store(self::COMMENT_IMAGES_DIR, $disk);
                $storedImage = $path ? basename($path) : null;
            } catch (Throwable $e) {
                \Log::error("Failed to store comment image: " . $e->getMessage());
                report($e);
            }
        }

        $payload = [
            'user_id' => $user->id,
            'comment' => $request->comment,
        ];

        if (Schema::hasColumn('comments', 'image')) {
            $payload['image'] = $storedImage;
        } elseif ($storedImage) {
            \Log::warning('Comment image uploaded but comments.image column is missing. Did you run migrations?');
        }

        $comment = $post->comments()->create($payload);
        $comment->load('user:id,name,image');

        // Create notification for post owner
        $notification = \App\Models\PostNotification::createNotification(
            $post->user_id,  // Post owner
            $user->id,        // User who commented
            $post->id,        // Post ID
            'comment'         // Type
        );

        // Broadcast notification via Ably for real-time updates
        if ($notification) {
            $this->broadcastNotification($notification, $user, $post, 'comment');
        }

        $commentPayload = [
            'id' => $comment->id,
            'user_id' => $comment->user_id,
            'user_name' => $comment->user->name,
            'user_image' => $comment->user->image ?? null,
            'comment' => $comment->comment,
            'comment_image' => Schema::hasColumn('comments', 'image') ? $comment->image : null,
            'likes_count' => 0,
            'liked' => false,
            'created_at' => $comment->created_at->toDateTimeString(),
        ];

        $this->publishFeedEvent("feed:post:{$post->id}", 'comment-created', $commentPayload);
        $this->broadcastPostStats($post);

        return response()->json([
            ...$commentPayload,
        ]);
    }

    public function getPostStats($postId)
    {
        $user = Auth::user();
        $userId = $user ? $user->id : null;

        // Single query to get post with counts and user like status
        $query = Post::withCount(['likes', 'comments']);
        
        if ($userId) {
            $query->withExists(['likes as user_liked' => function($query) use ($userId) {
                $query->where('user_id', $userId);
            }]);
        }
        
        $post = $query->findOrFail($postId);

        return response()->json([
            'post_id' => $post->id,
            'likes_count' => (int) $post->likes_count,
            'comments_count' => (int) $post->comments_count,
            'liked' => $userId ? (bool) $post->user_liked : false,
        ]);
    }

    public function AddLike($id)
    {
        $user = Auth::user();
        $post = Post::findOrFail($id);
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Use firstOrCreate to check and create in single operation
        $existingLike = $post->likes()->where('user_id', $user->id)->first();
        
        if ($existingLike) {
            $existingLike->delete();
            $liked = false;
            $countChange = -1;
        } else {
            $post->likes()->create(['user_id' => $user->id]);
            $liked = true;
            $countChange = 1;
            
            // Create notification for post owner
            $notification = \App\Models\PostNotification::createNotification(
                $post->user_id,  // Post owner
                $user->id,        // User who liked
                $post->id,        // Post ID
                'like'            // Type
            );

            // Broadcast notification via Ably for real-time updates
            if ($notification) {
                $this->broadcastNotification($notification, $user, $post, 'like');
            }
        }

        // Use cached counts to avoid redundant query
        $post->loadCount('likes');
        $currentCount = $post->likes_count;

        $this->broadcastPostStats($post);

        return response()->json([
            'liked' => $liked,
            'likes_count' => $currentCount,
        ]);
    }

    public function deleteComment($id)
    {
        $comment = Comment::find($id);
        $postId = $comment?->post_id;
        $commentId = $comment?->id;
        $comment?->delete();

        if ($postId && $commentId) {
            $this->publishFeedEvent("feed:post:{$postId}", 'comment-deleted', [
                'comment_id' => (int) $commentId,
            ]);

            $post = Post::find($postId);
            if ($post) {
                $this->broadcastPostStats($post);
            }
        }
        return response()->json(['message' => 'Comment Deleted Succesfully']);
    }

    public function updateComment(Request $request, $id)
    {
        $request->validate([
            'comment' => 'required|string|max:2000',
            'image' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:5120',
            'remove_image' => 'nullable|boolean',
        ]);

        $comment = Comment::findOrFail($id);

        $disk = $this->postImagesDisk();
        $removeImage = (bool) $request->boolean('remove_image');
        $newImageName = null;

        if ($removeImage && Schema::hasColumn('comments', 'image')) {
            if ($comment->image) {
                $this->deleteFileFromDisk(self::COMMENT_IMAGES_DIR . '/' . $comment->image, $disk);
            }
            $comment->image = null;
        }

        if ($request->hasFile('image') && $request->file('image')->isValid() && Schema::hasColumn('comments', 'image')) {
            try {
                $this->ensurePostImagesDirectoryExists($disk, self::COMMENT_IMAGES_DIR);
                $path = $request->file('image')->store(self::COMMENT_IMAGES_DIR, $disk);
                $newImageName = $path ? basename($path) : null;

                if ($newImageName) {
                    if ($comment->image) {
                        $this->deleteFileFromDisk(self::COMMENT_IMAGES_DIR . '/' . $comment->image, $disk);
                    }
                    $comment->image = $newImageName;
                }
            } catch (Throwable $e) {
                \Log::error("Failed to update comment image: " . $e->getMessage());
                report($e);
            }
        }

        $comment->comment = $request->comment;
        $comment->save();

        $likesCount = 0;
        $liked = false;
        if (Schema::hasTable('comment_likes')) {
            $likesCount = CommentLike::where('comment_id', $comment->id)->count();
            $userId = Auth::id();
            if ($userId) {
                $liked = CommentLike::where('comment_id', $comment->id)->where('user_id', $userId)->exists();
            }
        }

        $payload = [
            'id' => $comment->id,
            'comment' => $comment->comment,
            'comment_image' => Schema::hasColumn('comments', 'image') ? $comment->image : null,
            'likes_count' => (int) $likesCount,
            'liked' => $liked,
        ];

        $this->publishFeedEvent("feed:post:{$comment->post_id}", 'comment-updated', [
            'id' => (int) $comment->id,
            'comment' => $payload['comment'],
            'comment_image' => $payload['comment_image'],
        ]);

        return response()->json($payload);
    }

    public function toggleCommentLike($commentId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!Schema::hasTable('comment_likes')) {
            return response()->json(['error' => 'Comment likes not available'], 400);
        }

        $comment = Comment::findOrFail($commentId);

        $existing = CommentLike::where('comment_id', $comment->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            CommentLike::create([
                'comment_id' => $comment->id,
                'user_id' => $user->id,
            ]);
            $liked = true;
        }

        $count = CommentLike::where('comment_id', $comment->id)->count();

        $this->publishFeedEvent("feed:post:{$comment->post_id}", 'comment-like-updated', [
            'comment_id' => (int) $comment->id,
            'likes_count' => (int) $count,
        ]);

        return response()->json([
            'comment_id' => $comment->id,
            'liked' => $liked,
            'likes_count' => (int) $count,
        ]);
    }

    public function addCommentLike(Request $request, $commentId)
    {
        $user = Auth::user();
        $comment = Comment::findOrFail($commentId);
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $userId = $request->user_id;
        $existingLike = $comment->likes()->where('user_id', $userId)->first();

        if ($existingLike) {
            $existingLike->delete();
            $liked = false;
        } else {
            $comment->likes()->create(['user_id' => $userId]);
            $liked = true;
            
            // Create notification for comment owner (if not liking own comment)
            if ($comment->user_id != $userId) {
                $notification = \App\Models\PostNotification::createNotification(
                    $comment->user_id,  // Comment owner
                    $userId,            // User who liked
                    $comment->post_id,  // Post ID
                    'comment_like'      // Type
                );

                // Broadcast notification via Ably for real-time updates
                if ($notification) {
                    $sender = User::find($userId);
                    $post = Post::find($comment->post_id);
                    $this->broadcastNotification($notification, $sender, $post, 'comment_like');
                }
            }
        }

        $count = $comment->likes()->count();

        $this->publishFeedEvent("feed:post:{$comment->post_id}", 'comment-like-updated', [
            'comment_id' => (int) $comment->id,
            'likes_count' => (int) $count,
        ]);

        return response()->json([
            'comment_id' => $comment->id,
            'liked' => $liked,
            'likes_count' => $count,
        ]);
    }

    public function getPostCommentStats($postId)
    {
        if (!Schema::hasTable('comment_likes')) {
            return response()->json(['post_id' => (int) $postId, 'stats' => []]);
        }

        $post = Post::findOrFail($postId);
        $userId = Auth::id();

        $commentIds = $post->comments()->pluck('id')->all();
        if (empty($commentIds)) {
            return response()->json(['post_id' => (int) $postId, 'stats' => []]);
        }

        $likesCountMap = CommentLike::query()
            ->selectRaw('comment_id, COUNT(*) as likes_count')
            ->whereIn('comment_id', $commentIds)
            ->groupBy('comment_id')
            ->pluck('likes_count', 'comment_id');

        $likedIds = [];
        if ($userId) {
            $likedIds = CommentLike::query()
                ->whereIn('comment_id', $commentIds)
                ->where('user_id', $userId)
                ->pluck('comment_id')
                ->all();
        }

        $stats = collect($commentIds)->mapWithKeys(function ($id) use ($likesCountMap, $likedIds) {
            return [
                (string) $id => [
                    'likes_count' => (int) ($likesCountMap[$id] ?? 0),
                    'liked' => in_array($id, $likedIds, true),
                ],
            ];
        });

        return response()->json([
            'post_id' => (int) $postId,
            'stats' => $stats,
        ]);
    }

    public function deletePost(Request $request, $id)
    {
        $post = Post::with(['comments', 'likes'])->find($id);

        if (!$post) {
            return $this->respondWithMessage($request, 'Post not found', false, 404);
        }

        if (Auth::id() !== $post->user_id) {
            return $this->respondWithMessage($request, "You can't delete this post", false, 403);
        }

        $images = $this->collectPostImages($post->images);

        DB::transaction(function () use ($post, $images) {
            if ($images->isNotEmpty()) {
                $this->deleteStoredImages($images);
            }

            $this->clearPostImages($post);
            $post->comments()->delete();
            $post->likes()->delete();
            $post->delete();
        });

        return $this->respondWithMessage($request, 'Post deleted successfully');
    }

    public function editPost(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        if (Auth::id() !== $post->user_id) {
            abort(403);
        }

        $request->validate([
            'description' => 'nullable|string',
            'keep_images' => 'array',
            'keep_images.*' => 'string',
            'removed_images' => 'array',
            'removed_images.*' => 'string',
            'new_images' => 'array',
            'new_images.*' => 'nullable|image|mimes:png,jpg,jpeg,webp',
        ]);

        $ownedImages = collect($post->images ?? []);

        $removedImages = collect($request->input('removed_images', []))
            ->filter(fn($image) => $ownedImages->contains($image))
            ->unique()
            ->values();

        $keepImages = collect($request->input('keep_images', []))
            ->filter(fn($image) => $ownedImages->contains($image))
            ->unique()
            ->values();

        if ($keepImages->isEmpty()) {
            $keepImages = $ownedImages->diff($removedImages)->values();
        }

        $incomingFiles = $request->file('new_images', []);
        if ($keepImages->count() + count($incomingFiles) > Post::MAX_IMAGES) {
            return back()->withErrors([
                'new_images' => "You can keep or upload up to " . Post::MAX_IMAGES . " images per post.",
            ])->withInput($request->except(['new_images']));
        }

        if ($removedImages->isNotEmpty()) {
            $this->deleteStoredImages($removedImages->all());
        }

        $newUploads = $this->persistUploadedImages($incomingFiles);

        $finalImages = $this->sanitizeImageNames(
            array_merge($keepImages->all(), $newUploads)
        );

        $post->update([
            'description' => $request->input('description', $post->description),
            'images' => $finalImages,
        ]);

        return back()->with('success', 'Post Updated Successfully');
    }

    public function storePost(Request $request)
    {
        $request->validate([
            'description' => 'nullable|string',
            'images' => 'array|max:' . Post::MAX_IMAGES,
            'images.*' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:10240', // 10MB max
        ]);

        $uploadedFiles = $request->file('images', []);
        if (count($uploadedFiles) > Post::MAX_IMAGES) {
            return back()->withErrors([
                'images' => "You can upload up to " . Post::MAX_IMAGES . " images per post."
            ])->withInput($request->except(['images']));
        }

        $imagesArray = $this->sanitizeImageNames($this->persistUploadedImages($uploadedFiles));

        $post = Post::create([
            'user_id' => Auth::id(),
            'description' => $request->description,
            'images' => $imagesArray,
        ]);

        // Handle @mentions in the post description
        if (!empty($request->description)) {
            $mentionedUserIds = $this->extractMentionedUserIds($request->description);

            if (!empty($mentionedUserIds)) {
                $sender = Auth::user();

                foreach ($mentionedUserIds as $mentionedUserId) {
                    $notification = \App\Models\PostNotification::createNotification(
                        $mentionedUserId,
                        $sender?->id,
                        $post->id,
                        'mention'
                    );

                    if ($notification && $sender) {
                        $this->broadcastNotification($notification, $sender, $post, 'mention');
                    }
                }
            }
        }

        $posts = Post::withCount(['likes', 'comments'])->latest()->get();

        return back()->with([
            'success' => 'Post Created Successfully',
            'posts' => $posts
        ]);
    }

    /**
     * Extract unique mentioned user IDs from a post description.
     *
     * Mentions are expected in the form @AccountName where AccountName
     * matches the user's name with spaces removed (case-insensitive).
     */
    private function extractMentionedUserIds(?string $description): array
    {
        $map = PostMentionResolver::mapTokensToUserIds($description);

        return array_values(array_unique(array_values($map)));
    }

    private function persistUploadedImages(array $files = []): array
    {
        $stored = [];
        $disk = $this->postImagesDisk();
        $this->ensurePostImagesDirectoryExists($disk, 'img/posts');

        foreach ($files as $image) {
            if (!$image || !$image->isValid()) continue;

            try {
                $path = $image->store('img/posts', $disk);
                if ($path) $stored[] = basename($path);
            } catch (Throwable $e) {
                \Log::error("Failed to store image: " . $e->getMessage());
                report($e);
            }
        }

        return $stored;
    }

    private function deleteStoredImages(iterable $filenames = []): void
    {
        $defaultDisk = $this->postImagesDisk();

        foreach ($this->uniqueImageDescriptors($filenames) as $descriptor) {
            $path = $descriptor['path'];
            $disk = $descriptor['disk'] ?? $defaultDisk;
            $publicId = $descriptor['public_id'];

            if ($publicId) {
                $this->deleteFileFromDisk($publicId, $disk);
            }

            if ($path) {
                $this->deleteFileFromDisk($path, $disk);
            }
        }
    }

    private function uniqueImageDescriptors(iterable $filenames): array
    {
        $unique = [];
        $seen = [];

        foreach ($filenames as $fileName) {
            if (!$fileName) {
                continue;
            }

            $descriptor = $this->normalizeImageDescriptor($fileName);

            if (!$descriptor['path'] && !$descriptor['public_id']) {
                continue;
            }

            $key = implode('|', [
                $descriptor['disk'] ?? $this->postImagesDisk(),
                $descriptor['public_id'] ?? '',
                $descriptor['path'] ?? '',
            ]);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $unique[] = $descriptor;
        }

        return $unique;
    }

    private function collectPostImages($images): Collection
    {
        if (blank($images)) {
            return collect();
        }

        if (is_string($images)) {
            $decoded = json_decode($images, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $images = $decoded;
            } else {
                $images = [$images];
            }
        }

        if ($images instanceof Collection) {
            return $images->filter(fn($image) => !blank($image))->values();
        }

        if (!is_array($images)) {
            return collect();
        }

        return collect($images)
            ->filter(fn($image) => !blank($image))
            ->values();
    }

    private function sanitizeImageNames(iterable $images): array
    {
        $names = [];

        foreach ($images as $image) {
            $name = $this->extractImageName($image);

            if ($name) {
                $names[] = $name;
            }
        }

        return array_values(array_unique($names));
    }

    private function extractImageName($image): ?string
    {
        $value = null;

        if (is_array($image)) {
            $value = $image['name']
                ?? $image['path']
                ?? $image['url']
                ?? $image['preview']
                ?? $image['id']
                ?? null;
        } else {
            $value = $image;
        }

        if (!$value) {
            return null;
        }

        $trimmed = trim((string) $value);

        if ($trimmed === '') {
            return null;
        }

        $withoutQuery = preg_split('/[?#]/', $trimmed, 2)[0];
        $basename = basename($withoutQuery);

        if ($basename === '' || $basename === '.' || $basename === '..') {
            return null;
        }

        return $basename;
    }

    private function normalizeImageDescriptor($image): array
    {
        if (is_array($image)) {
            return [
                'path' => $this->normalizeImagePath($image['path'] ?? $image['url'] ?? $image['preview'] ?? $image['id'] ?? null),
                'disk' => $image['disk'] ?? $image['storage_disk'] ?? null,
                'public_id' => $image['public_id'] ?? $image['provider_public_id'] ?? null,
            ];
        }

        return [
            'path' => $this->normalizeImagePath($image),
            'disk' => null,
            'public_id' => null,
        ];
    }

    private function normalizeImagePath($path): ?string
    {
        if (!$path) {
            return null;
        }

        $value = trim((string) $path);

        if ($value === '') {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $value)) {
            return null;
        }

        $value = ltrim($value, '/');

        if (str_starts_with($value, 'storage/')) {
            $value = substr($value, strlen('storage/'));
        }

        if (str_starts_with($value, 'public/')) {
            $value = substr($value, strlen('public/'));
        }

        if (!str_contains($value, '/')) {
            $value = 'img/posts/' . $value;
        }

        return $value;
    }

    private function deleteFileFromDisk(string $path, ?string $disk = null): void
    {
        $trimmed = ltrim($path, '/');
        $diskName = $disk ?? $this->postImagesDisk();

        try {
            $storage = Storage::disk($diskName);
            if ($storage->exists($trimmed)) {
                $storage->delete($trimmed);
                return;
            }
        } catch (Throwable $exception) {
            report($exception);
        }

        if ($diskName === 'public') {
            $publicStoragePath = public_path('storage/' . $trimmed);
            if (file_exists($publicStoragePath)) {
                @unlink($publicStoragePath);
                return;
            }

            $absolutePath = public_path($trimmed);
            if (file_exists($absolutePath)) {
                @unlink($absolutePath);
            }
        }
    }

    private function respondWithMessage(Request $request, string $message, bool $success = true, int $status = 200)
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => $message], $status);
        }

        $flashKey = $success ? 'success' : 'error';

        return redirect()->back()->with($flashKey, $message);
    }

    private function clearPostImages(Post $post): void
    {
        $post->forceFill(['images' => []]);

        if (method_exists($post, 'saveQuietly')) {
            $post->saveQuietly();
            return;
        }

        $originalTimestamps = $post->timestamps;
        $post->timestamps = false;
        $post->save();
        $post->timestamps = $originalTimestamps;
    }

    private function postImagesDisk(): string
    {
        // Always fallback to public
        $configured = config('filesystems.post_images_disk')
            ?? env('POST_IMAGES_DISK')
            ?? 'public';

        $disks = config('filesystems.disks', []);

        return array_key_exists($configured, $disks) ? $configured : 'public';
    }

    private function ensurePostImagesDirectoryExists(string $disk, string $directory = 'img/posts'): void
    {
        $storage = Storage::disk($disk);

        // Make directory if it doesn't exist
        if (!$storage->exists($directory)) {
            try {
                $storage->makeDirectory($directory, 0755, true);
            } catch (Throwable $e) {
                // fallback to manual creation for public disk
                if ($disk === 'public') {
                    $fullPath = storage_path('app/public/' . $directory);
                    if (!file_exists($fullPath)) {
                        mkdir($fullPath, 0755, true);
                    }
                }
                report($e);
            }
        }
    }
}
