<?php

namespace Tests\Unit\Modules\AilesInvisibles\Invoice;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AilesInvisibles\Domain\Invoice\ValueObjects\InvoiceItem;
use Modules\AilesInvisibles\Domain\Invoice\ValueObjects\InvoiceItems;
use Tests\Concerns\WithAilesInvisibles;
use Tests\TestCase;

/**
 * Invoice Items Value Object Tests
 */
class InvoiceItemsTest extends TestCase
{
    use RefreshDatabase;
    use WithAilesInvisibles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupAIModule();
    }

    public function test_empty_items_has_zero_totals(): void
    {
        $items = new InvoiceItems;

        $this->assertEquals(0, $items->subtotal()->amount);
        $this->assertEquals(0, $items->tax()->amount);
        $this->assertEquals(0, $items->total()->amount);
        $this->assertEquals(0, $items->count());
    }

    public function test_single_item_calculates_correctly(): void
    {
        $item = new InvoiceItem(
            description: 'Product A',
            quantity: 2,
            unitPrice: 100.00,
            taxRate: 20.0
        );

        $items = new InvoiceItems([$item]);

        // Subtotal: 2 * 100 = 200
        $this->assertEquals(20000, $items->subtotal()->amount);
        // Tax: 200 * 0.20 = 40
        $this->assertEquals(4000, $items->tax()->amount);
        // Total: 200 + 40 = 240
        $this->assertEquals(24000, $items->total()->amount);
        $this->assertEquals(1, $items->count());
    }

    public function test_multiple_items_sum_correctly(): void
    {
        $item1 = new InvoiceItem('Product A', 2, 100.00, 20.0);
        $item2 = new InvoiceItem('Product B', 1, 50.00, 10.0);
        $item3 = new InvoiceItem('Product C', 3, 25.00, 0.0);

        $items = new InvoiceItems([$item1, $item2, $item3]);

        // Subtotal: 200 + 50 + 75 = 325
        $this->assertEquals(32500, $items->subtotal()->amount);
        // Tax: 40 + 5 + 0 = 45
        $this->assertEquals(4500, $items->tax()->amount);
        // Total: 325 + 45 = 370
        $this->assertEquals(37000, $items->total()->amount);
        $this->assertEquals(3, $items->count());
    }

    public function test_from_array_creates_items(): void
    {
        $data = [
            ['description' => 'Product A', 'quantity' => 2, 'unit_price' => 100.00, 'tax' => 20.0],
            ['description' => 'Product B', 'quantity' => 1, 'unit_price' => 50.00, 'tax' => 10.0],
        ];

        $items = InvoiceItems::fromArray($data);

        $this->assertEquals(2, $items->count());
        $this->assertEquals(25000, $items->subtotal()->amount);
    }

    public function test_to_array_converts_correctly(): void
    {
        $item = new InvoiceItem('Product A', 2, 100.00, 20.0);
        $items = new InvoiceItems([$item]);

        $array = $items->toArray();

        $this->assertCount(1, $array);
        $this->assertEquals('Product A', $array[0]['description']);
        $this->assertEquals(2, $array[0]['quantity']);
        $this->assertEquals(100.0, $array[0]['unit_price']);
        $this->assertEquals(20.0, $array[0]['tax']);
        $this->assertEquals(200.0, $array[0]['total']);
    }

    public function test_items_returns_array_of_items(): void
    {
        $item1 = new InvoiceItem('Product A', 2, 100.00, 20.0);
        $item2 = new InvoiceItem('Product B', 1, 50.00, 10.0);

        $items = new InvoiceItems([$item1, $item2]);

        $itemArray = $items->items();

        $this->assertCount(2, $itemArray);
        $this->assertInstanceOf(InvoiceItem::class, $itemArray[0]);
        $this->assertInstanceOf(InvoiceItem::class, $itemArray[1]);
    }
}
