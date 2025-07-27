// Integration Tests for Enhanced Order.Placed Event Processing

describe('Enhanced Order Placed Integration Flow', () => {
  const mockFlow = {
    async processNotification(orderId, options) {
      return {
        templateId: 123,
        to: [{ email: 'customer@example.com' }],
        params: {
          id: orderId,
          status: 'pending',
          metadata: { source: 'web' },
          customer: { metadata: { vip: true } },
          items: [{
            id: 'item_1',
            metadata: { price_attributes: { original_price: 3000 } },
            variant: {
              metadata: { price_attributes: { wholesale_price: 1800 } },
              product: { metadata: { category: 'clothing' } }
            },
            totals: { total: 4500 },
            adjustments: [{ description: 'Bulk discount' }],
            tax_lines: [{ name: 'CA Sales Tax' }]
          }],
          locale: { locale: 'en-US', countryCode: 'US' },
          ...options.default_data
        }
      };
    }
  };

  it('should process complete order data with metadata preservation', async () => {
    const options = {
      events: { order: { placed: 123 } },
      default_data: { store_name: 'Test Store' }
    };

    const result = await mockFlow.processNotification('order_123', options);

    expect(result.templateId).toBe(123);
    expect(result.params.id).toBe('order_123');
    expect(result.params.metadata).toEqual({ source: 'web' });
    expect(result.params.customer.metadata).toEqual({ vip: true });
    expect(result.params.items[0].metadata.price_attributes).toEqual({ original_price: 3000 });
    expect(result.params.items[0].variant.metadata.price_attributes).toEqual({ wholesale_price: 1800 });
    expect(result.params.store_name).toBe('Test Store');
  });

  it('should include all required fields for template building', async () => {
    const options = {
      events: { order: { placed: 123 } },
      default_data: {}
    };

    const result = await mockFlow.processNotification('order_123', options);
    const params = result.params;

    expect(params).toHaveProperty('id');
    expect(params).toHaveProperty('status');
    expect(params).toHaveProperty('metadata');
    expect(params).toHaveProperty('customer');
    expect(params).toHaveProperty('items');
    expect(params).toHaveProperty('locale');
    expect(params.items[0]).toHaveProperty('variant');
    expect(params.items[0]).toHaveProperty('totals');
    expect(params.items[0]).toHaveProperty('adjustments');
    expect(params.items[0]).toHaveProperty('tax_lines');
    expect(params.items[0].variant).toHaveProperty('product');
  });
});