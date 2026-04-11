<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskCommentController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
            'task_id' => 'required|exists:tasks,id',
        ]);

        $comment = TaskComment::create([
            'content' => $request->content,
            'task_id' => $request->task_id,
            'user_id' => Auth::id(),
        ]);

        // Update project last activity
        $task = Task::find($request->task_id);
        $task->project->update([
            'last_activity' => now(),
            'is_updated' => true,
        ]);

        return redirect()->back()
            ->with('success', 'Comment added successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TaskComment $taskComment)
    {
        $taskComment->delete();

        return redirect()->back()
            ->with('success', 'Comment deleted successfully.');
    }
}
