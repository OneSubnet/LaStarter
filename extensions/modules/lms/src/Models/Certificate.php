<?php

namespace Modules\Lms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

final class Certificate extends Model
{
    protected $table = 'lms_certificates';

    protected $fillable = [
        'enrollment_id',
        'certificate_number',
        'issued_at',
        'pdf_path',
        'teacher_name',
        'teacher_role',
        'theme',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        self::creating(function (self $certificate) {
            if (empty($certificate->certificate_number)) {
                $certificate->certificate_number = self::generateCertificateNumber();
            }
        });
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public static function generateCertificateNumber(): string
    {
        return sprintf(
            '%s-%s-%s',
            strtoupper(Str::random(3)),
            strtoupper(Str::random(4)),
            strtoupper(Str::random(3)),
        );
    }
}
