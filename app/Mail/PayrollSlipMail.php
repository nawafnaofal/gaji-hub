<?php

namespace App\Mail;

use App\Models\Payroll;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PayrollSlipMail extends Mailable
{
    use Queueable, SerializesModels;

    public $payroll;

    /**
     * Create a new message instance.
     */
    public function __construct(Payroll $payroll)
    {
        $this->payroll = $payroll;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Slip Gaji Bulan ' . $this->payroll->period_month . '/' . $this->payroll->period_year,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.slip',
            with: [
                'employeeName' => $this->payroll->employee->user->name,
                'period' => $this->payroll->period_month . '/' . $this->payroll->period_year,
                'netSalary' => $this->payroll->net_salary,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        // Generate PDF on the fly
        $pdf = Pdf::loadView('slip', ['payroll' => $this->payroll]);
        
        return [
            Attachment::fromData(fn () => $pdf->output(), 'Slip_Gaji_' . $this->payroll->period_month . '_' . $this->payroll->period_year . '.pdf')
                    ->withMime('application/pdf'),
        ];
    }
}
