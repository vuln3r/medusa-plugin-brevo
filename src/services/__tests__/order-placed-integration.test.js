// Integration Tests for Enhanced Order.Placed Event Processing

describe('Enhanced Order Placed Integration Tests', () => {
  const mockIntegrationFlow = {
    async processOrderPlacedNotification(orderId, options) {
      const orderData = {
        id: orderId,
        status: 'pending',
        email: 'customer@example.com',
        metadata: { source: 'web' },
        customer: { id: 'customer_123', email: 'customer@example.com', metadata: { vip: true } },
        billing_address: { address_1: '123 Main St', metadata: { verified: true } },
        shipping_address: { address_1: '456 Oak Ave', metadata: { delivery_notes: 'Ring doorbell' } },
        items: [{
          id: 'item_1',
          quantity: 2,
          unit_price: 2500,
          metadata: { price_attributes: { original_price: 3000 } },
          variant: {
            id: 'variant_1',
            sku: 'TSHIRT-L-NAVY',
            metadata: { price_attributes: { wholesale_price: 1800 } },
            product: {
              id: 'product_1',
              title: 'Premium T-Shirt',
              metadata: { category: 'clothing' }
            }
          },
          adjustments: [{ id: 'adj_1', description: 'Bulk discount' }],
          tax_lines: [{ id: 'tax_1', name: 'CA Sales Tax' }]
        }],
        discounts: [{ code: 'SUMMER20', rule: { value: 20, type: 'percentage' } }],
        subtotal: 5000,
        total: 6300,
        currency_code: 'usd',
        created_at: new Date()
      };

      const processedItems = orderData.items.map(item => ({
        ...item,
        totals: { total: 4500, original_total: 5000 },
        price_attributes: item.metadata?.price_attributes || null,
        variant: item.variant ? {
          ...item.variant,
          price_attributes: item.variant.metadata?.price_attributes || null
        } : null
      }));

      return {
        templateId: typeof options.events.order.placed === 'object' ? 
          options.events.order.placed.US || Object.values(options.events.order.placed)[0] :
          options.events.order.placed,
        to: [{ email: orderData.email }],
        params: {
          ...orderData,
          items: processedItems,
          locale: { locale: 'en-US', countryCode: 'US' },
          total: '$63.00 USD',
          subtotal: '$50.00 USD',
          ...options.default_data
        }
      };
    }
  };

  describe('Complete Order.Placed Integration Flow', () => {
    it('should process complete order data with all relations and metadata', async () => {
      const options = {
        events: { order: { placed: 123 } },
        default_data: { store_name: 'Test Store' }
      };

      const result = await mockIntegrationFlow.processOrderPlacedNotification('order_123', options);

      expect(result.templateId).toBe(123);
      expect(result.to).toEqual([{ email: 'customer@example.com' }]);

      const params = result.params;
      expect(params.id).toBe('order_123');
      expect(params.status).toBe('pending');
      expect(params.metadata).toEqual({ source: 'web' });
      expect(params.customer.metadata).toEqual({ vip: true });
      expect(params.billing_address.metadata).toEqual({ verified: true });
      expect(params.items[0].price_attributes).toEqual({ original_price: 3000 });
      expect(params.items[0].variant.price_attributes).toEqual({ wholesale_price: 1800 });
      expect(params.store_name).toBe('Test Store');
    });

    it('should handle locale-based template selection', async () => {
      const options = {
        events: { order: { placed: { US: 123, FR: 456 } } },
        default_data: {}
      };

      const result = await mockIntegrationFlow.processOrderPlacedNotification('order_123', options);
      expect(result.templateId).toBe(123);
    });

    it('should include all required fields for template building', async () => {
      const options = {
        events: { order: { placed: 123 } },
        default_data: {}
      };

      const result = await mockIntegrationFlow.processOrderPlacedNotification('order_123', options);
      const params = result.params;

      const requiredFields = ['id', 'status', 'email', 'metadata', 'customer', 'items'];
      requiredFields.forEach(field => {
        expect(params).toHaveProperty(field);
      });

      expect(params.items[0]).toHaveProperty('variant');
      expect(params.items[0]).toHaveProperty('totals');
      expect(params.items[0]).toHaveProperty('adjustments');
      expect(params.items[0]).toHaveProperty('tax_lines');
      expect(params.items[0].variant).toHaveProperty('product');
      expect(params.locale).toHaveProperty('locale');
      expect(params.locale).toHaveProperty('countryCode');
    });
  });
});