<?php

namespace Tests\Unit\Modules\AilesInvisibles\Invoice;

use App\Domain\ValueObjects\Money;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AilesInvisibles\Domain\Invoice\ValueObjects\InvoiceItem;
use Tests\Concerns\WithAilesInvisibles;
use Tests\TestCase;

/**
 * Invoice Item Value Object Tests
 */
class InvoiceItemTest extends TestCase
{
    use RefreshDatabase;
    use WithAilesInvisibles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupAIModule();
    }

    public function test_calculates_total(): void
    {
        $item = new InvoiceItem(
            description: 'Product A',
            quantity: 2,
            unitPrice: 100.00
        );

        $total = $item->total();

        $this->assertInstanceOf(Money::class, $total);
        $this->assertEquals(20000, $total->amount); // 2 * 100.00 in cents
    }

    public function test_calculates_tax_amount(): void
    {
        $item = new InvoiceItem(
            description: 'Product A',
            quantity: 2,
            unitPrice: 100.00,
            taxRate: 20.0
        );

        $taxAmount = $item->taxAmount();

        $this->assertInstanceOf(Money::class, $taxAmount);
        $this->assertEquals(4000, $taxAmount->amount); // 200 * 0.20 in cents
    }

    public function test_calculates_total_with_tax(): void
    {
        $item = new InvoiceItem(
            description: 'Product A',
            quantity: 2,
            unitPrice: 100.00,
            taxRate: 20.0
        );

        $totalWithTax = $item->totalWithTax();

        $this->assertInstanceOf(Money::class, $totalWithTax);
        $this->assertEquals(24000, $totalWithTax->amount); // 200 + 40 in cents
    }

    public function test_zero_tax_rate(): void
    {
        $item = new InvoiceItem(
            description: 'Product A',
            quantity: 1,
            unitPrice: 100.00,
            taxRate: 0.0
        );

        $this->assertEquals(0, $item->taxAmount()->amount);
        $this->assertEquals(10000, $item->total()->amount);
    }

    public function test_readonly_properties(): void
    {
        $item = new InvoiceItem(
            description: 'Product A',
            quantity: 2,
            unitPrice: 100.00,
            taxRate: 20.0
        );

        $this->assertEquals('Product A', $item->description);
        $this->assertEquals(2, $item->quantity);
        $this->assertEquals(100.0, $item->unitPrice);
        $this->assertEquals(20.0, $item->taxRate);
    }
}
