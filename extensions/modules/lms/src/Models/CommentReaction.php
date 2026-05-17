<?php

namespace Modules\Lms\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CommentReaction extends Model
{
    protected $table = 'lms_comment_reactions';

    protected $fillable = [
        'comment_id',
        'user_id',
        'emoji',
    ];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(LessonComment::class, 'comment_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
