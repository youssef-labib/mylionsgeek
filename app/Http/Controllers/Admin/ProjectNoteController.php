<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProjectNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectNoteController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'tags' => 'nullable|array',
            'is_pinned' => 'boolean',
        ]);

        $data = $request->all();
        $data['user_id'] = Auth::id();
        $data['tags'] = $data['tags'] ?? [];
        $data['is_pinned'] = $data['is_pinned'] ?? false;

        ProjectNote::create($data);

        return redirect()->back()
            ->with('success', 'Note created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProjectNote $projectNote)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'tags' => 'nullable|array',
            'is_pinned' => 'boolean',
        ]);

        $data = $request->all();
        $data['tags'] = $data['tags'] ?? [];

        $projectNote->update($data);

        return redirect()->back()
            ->with('success', 'Note updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProjectNote $projectNote)
    {
        $projectNote->delete();

        return redirect()->back()
            ->with('success', 'Note deleted successfully.');
    }

    /**
     * Toggle note pin status
     */
    public function togglePin(ProjectNote $projectNote)
    {
        $projectNote->update(['is_pinned' => ! $projectNote->is_pinned]);

        return redirect()->back()
            ->with('success', $projectNote->is_pinned ? 'Note pinned successfully.' : 'Note unpinned successfully.');
    }
}
