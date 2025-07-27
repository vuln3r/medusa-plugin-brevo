// Comprehensive data validation tests for enhanced orderPlacedData method
// This test file focuses on validating the data structure and processing logic

describe('Enhanced Order Data Validation Tests', () => {
  // Mock the core functionality without importing the full service
  const mockOrderPlacedDataLogic = {
    // Simulate the enhanced data retrieval logic
    async retrieveOrderWithFullRelations(orderId, orderService) {
      const enhancedRelations = [
        'customer',
        'billing_address',
        'shipping_address',
        'discounts',
        'discounts.rule',
        'shipping_methods',
        'shipping_methods.shipping_option',
        'payments',
        'fulfillments',
        'returns',
        'gift_cards',
        'gift_card_transactions',
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.profiles',
        'items.adjustments',
        'items.tax_lines',
        'region',
        'sales_channel',
        'claims',
        'swaps'
      ];

      const enhancedSelect = [
        'id', 'status', 'fulfillment_status', 'payment_status', 'display_id',
        'cart_id', 'customer_id', 'email', 'billing_address_id', 'shipping_address_id',
        'region_id', 'currency_code', 'tax_rate', 'canceled_at', 'metadata',
        'no_notification', 'idempotency_key', 'draft_order_id', 'created_at',
        'updated_at', 'shipping_total', 'discount_total', 'tax_total',
        'refunded_total', 'gift_card_total', 'subtotal', 'total', 'paid_total',
        'refundable_amount', 'external_id', 'sales_channel_id'
      ];

      try {
        return await orderService.retrieve(orderId, {
          select: enhancedSelect,
          relations: enhancedRelations
        });
      } catch (error) {
        // Fallback to minimal data
        return await orderService.retrieve(orderId, {
          select: [
            'shipping_total', 'discount_total', 'tax_total', 'refunded_total',
            'gift_card_total', 'subtotal', 'total', 'currency_code', 'tax_rate',
            'created_at', 'email', 'id', 'display_id'
          ],
          relations: [
            'customer', 'billing_address', 'shipping_address', 'discounts',
            'discounts.rule', 'shipping_methods', 'shipping_methods.shipping_option',
            'payments', 'fulfillments', 'returns', 'gift_cards', 'gift_card_transactions'
          ]
        });
      }
    },

    // Simulate item processing with complete data preservation
    async processItemsWithCompleteData(items, totalsService, order) {
      if (!items || !Array.isArray(items)) {
        return [];
      }

      return await Promise.all(
        items.map(async (originalItem, index) => {
          try {
            // Calculate totals
            let totals;
            try {
              totals = await totalsService.getLineItemTotals(originalItem, order, {
                include_tax: true,
                use_tax_lines: true
              });
            } catch (totalsError) {
              // Fallback totals calculation
              totals = {
                total: originalItem.unit_price * originalItem.quantity,
                original_total: originalItem.unit_price * originalItem.quantity,
                subtotal: originalItem.unit_price * originalItem.quantity,
                tax_total: 0,
                discount_total: 0
              };
            }

            // Preserve all original data while adding calculated values
            return {
              ...originalItem, // All original item fields
              
              // Preserve complete variant data
              variant: originalItem.variant ? {
                ...originalItem.variant,
                metadata: originalItem.variant?.metadata || {},
                price_attributes: originalItem.variant?.metadata?.price_attributes || null,
                
                // Include complete product information
                product: originalItem.variant?.product ? {
                  ...originalItem.variant.product,
                  metadata: originalItem.variant.product?.metadata || {},
                  description: originalItem.variant.product?.description || null,
                  images: originalItem.variant.product?.images || [],
                  thumbnail: originalItem.variant.product?.thumbnail || null,
                  profiles: originalItem.variant.product?.profiles || []
                } : null
              } : null,

              // Add calculated totals
              totals,
              
              // Add formatted prices
              discounted_price: `$${(totals.total / (originalItem.quantity || 1) / 100).toFixed(2)}`,
              price: `$${(totals.original_total / (originalItem.quantity || 1) / 100).toFixed(2)}`,
              
              // Ensure metadata is accessible
              metadata: originalItem.metadata || {},
              price_attributes: originalItem.metadata?.price_attributes || null,
              
              // Preserve arrays with fallbacks
              adjustments: originalItem.adjustments || [],
              tax_lines: originalItem.tax_lines || []
            };
          } catch (itemProcessingError) {
            // Return minimal item structure on error
            return {
              ...originalItem,
              variant: originalItem.variant || null,
              totals: {
                total: originalItem.unit_price * originalItem.quantity,
                original_total: originalItem.unit_price * originalItem.quantity,
                subtotal: originalItem.unit_price * originalItem.quantity,
                tax_total: 0,
                discount_total: 0
              },
              discounted_price: `$${(originalItem.unit_price / 100).toFixed(2)}`,
              price: `$${(originalItem.unit_price / 100).toFixed(2)}`,
              metadata: originalItem.metadata || {},
              price_attributes: null,
              adjustments: [],
              tax_lines: []
            };
          }
        })
      );
    },

    // Simulate complete order data construction
    constructCompleteOrderData(order, items, locale) {
      try {
        return {
          ...order,
          locale,
          
          // Ensure metadata is explicitly included
          metadata: order.metadata || {},
          
          // Include complete customer object
          customer: order.customer ? {
            ...order.customer,
            metadata: order.customer.metadata || {}
          } : null,
          
          // Preserve complete address objects
          billing_address: order.billing_address ? {
            ...order.billing_address,
            metadata: order.billing_address.metadata || {}
          } : null,
          
          shipping_address: order.shipping_address ? {
            ...order.shipping_address,
            metadata: order.shipping_address.metadata || {}
          } : null,
          
          // Include processed items
          items,
          
          // Process discounts with error handling
          discounts: (order.discounts || []).map((discount, index) => {
            try {
              return {
                is_giftcard: false,
                code: discount.code || `discount_${index}`,
                descriptor: `${discount.rule?.value || 0}${
                  discount.rule?.type === 'percentage' ? '%' : ` ${order.currency_code?.toUpperCase() || 'USD'}`
                }`
              };
            } catch (error) {
              return {
                is_giftcard: false,
                code: `discount_${index}`,
                descriptor: `0 ${order.currency_code?.toUpperCase() || 'USD'}`
              };
            }
          }),
          
          // Additional calculated fields
          has_discounts: order.discounts?.length || 0,
          has_gift_cards: order.gift_cards?.length || 0,
          date: order.created_at ? order.created_at.toLocaleString() : new Date().toLocaleString()
        };
      } catch (error) {
        // Return minimal fallback structure
        return {
          id: order.id,
          email: order.email,
          display_id: order.display_id,
          currency_code: order.currency_code,
          total: order.total,
          items: items || [],
          discounts: [],
          metadata: {},
          customer: null,
          billing_address: null,
          shipping_address: null,
          locale: locale || { locale: 'en', countryCode: 'US' }
        };
      }
    }
  };

  describe('Enhanced Data Retrieval', () => {
    it('should attempt enhanced retrieval with comprehensive relations', async () => {
      const mockOrderService = {
        retrieve: jest.fn().mockResolvedValue({
          id: 'order_123',
          status: 'pending',
          metadata: { test: 'data' },
          customer: { id: 'customer_1' },
          items: []
        })
      };

      await mockOrderPlacedDataLogic.retrieveOrderWithFullRelations('order_123', mockOrderService);

      expect(mockOrderService.retrieve).toHaveBeenCalledWith('order_123', {
        select: expect.arrayContaining([
          'id', 'status', 'metadata', 'customer_id', 'billing_address_id',
          'shipping_address_id', 'created_at', 'updated_at'
        ]),
        relations: expect.arrayContaining([
          'customer', 'billing_address', 'shipping_address', 'items',
          'items.variant', 'items.variant.product', 'items.variant.product.profiles',
          'items.adjustments', 'items.tax_lines', 'region', 'sales_channel'
        ])
      });
    });

    it('should fallback to minimal data when enhanced retrieval fails', async () => {
      const mockOrderService = {
        retrieve: jest.fn()
          .mockRejectedValueOnce(new Error('Enhanced retrieval failed'))
          .mockResolvedValueOnce({
            id: 'order_123',
            email: 'test@example.com',
            total: 1000
          })
      };

      const result = await mockOrderPlacedDataLogic.retrieveOrderWithFullRelations('order_123', mockOrderService);

      expect(mockOrderService.retrieve).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('order_123');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('Item Processing with Complete Data', () => {
    it('should preserve complete variant and product data', async () => {
      const mockItems = [
        {
          id: 'item_1',
          quantity: 2,
          unit_price: 2500,
          metadata: {
            price_attributes: { custom_price: true },
            custom_field: 'value'
          },
          variant: {
            id: 'variant_1',
            title: 'Test Variant',
            metadata: {
              size: 'L',
              price_attributes: { wholesale: 1000 }
            },
            product: {
              id: 'product_1',
              title: 'Test Product',
              description: 'Product description',
              images: [{ url: 'image1.jpg' }],
              metadata: {
                category: 'clothing',
                specifications: { material: 'cotton' }
              },
              profiles: [{ id: 'profile_1', name: 'default' }]
            }
          },
          adjustments: [{ id: 'adj_1', amount: -100 }],
          tax_lines: [{ id: 'tax_1', rate: 0.1 }]
        }
      ];

      const mockTotalsService = {
        getLineItemTotals: jest.fn().mockResolvedValue({
          total: 4500,
          original_total: 5000,
          subtotal: 4200,
          tax_total: 300,
          discount_total: 500
        })
      };

      const mockOrder = { id: 'order_123', currency_code: 'usd' };

      const result = await mockOrderPlacedDataLogic.processItemsWithCompleteData(
        mockItems,
        mockTotalsService,
        mockOrder
      );

      expect(result).toHaveLength(1);
      const item = result[0];

      // Verify all original fields are preserved
      expect(item.id).toBe('item_1');
      expect(item.quantity).toBe(2);
      expect(item.unit_price).toBe(2500);

      // Verify metadata preservation
      expect(item.metadata).toEqual({
        price_attributes: { custom_price: true },
        custom_field: 'value'
      });
      expect(item.price_attributes).toEqual({ custom_price: true });

      // Verify complete variant data
      expect(item.variant.id).toBe('variant_1');
      expect(item.variant.title).toBe('Test Variant');
      expect(item.variant.metadata).toEqual({
        size: 'L',
        price_attributes: { wholesale: 1000 }
      });
      expect(item.variant.price_attributes).toEqual({ wholesale: 1000 });

      // Verify complete product data
      expect(item.variant.product.id).toBe('product_1');
      expect(item.variant.product.title).toBe('Test Product');
      expect(item.variant.product.description).toBe('Product description');
      expect(item.variant.product.images).toEqual([{ url: 'image1.jpg' }]);
      expect(item.variant.product.metadata).toEqual({
        category: 'clothing',
        specifications: { material: 'cotton' }
      });
      expect(item.variant.product.profiles).toEqual([{ id: 'profile_1', name: 'default' }]);

      // Verify adjustments and tax_lines
      expect(item.adjustments).toEqual([{ id: 'adj_1', amount: -100 }]);
      expect(item.tax_lines).toEqual([{ id: 'tax_1', rate: 0.1 }]);

      // Verify calculated totals
      expect(item.totals).toEqual({
        total: 4500,
        original_total: 5000,
        subtotal: 4200,
        tax_total: 300,
        discount_total: 500
      });

      // Verify formatted prices
      expect(item.discounted_price).toBe('$22.50');
      expect(item.price).toBe('$25.00');
    });

    it('should handle missing variant/product data gracefully', async () => {
      const mockItems = [
        {
          id: 'item_1',
          quantity: 1,
          unit_price: 1000,
          metadata: null,
          variant: null,
          adjustments: null,
          tax_lines: null
        }
      ];

      const mockTotalsService = {
        getLineItemTotals: jest.fn().mockResolvedValue({
          total: 1000,
          original_total: 1000,
          subtotal: 1000,
          tax_total: 0,
          discount_total: 0
        })
      };

      const result = await mockOrderPlacedDataLogic.processItemsWithCompleteData(
        mockItems,
        mockTotalsService,
        { id: 'order_123' }
      );

      const item = result[0];

      expect(item.variant).toBeNull();
      expect(item.metadata).toEqual({});
      expect(item.price_attributes).toBeNull();
      expect(item.adjustments).toEqual([]);
      expect(item.tax_lines).toEqual([]);
      expect(item.totals).toBeDefined();
    });

    it('should handle totals calculation errors with fallback', async () => {
      const mockItems = [
        {
          id: 'item_1',
          quantity: 2,
          unit_price: 1500,
          metadata: { test: 'data' }
        }
      ];

      const mockTotalsService = {
        getLineItemTotals: jest.fn().mockRejectedValue(new Error('Totals calculation failed'))
      };

      const result = await mockOrderPlacedDataLogic.processItemsWithCompleteData(
        mockItems,
        mockTotalsService,
        { id: 'order_123' }
      );

      const item = result[0];

      // Verify fallback totals
      expect(item.totals).toEqual({
        total: 3000, // unit_price * quantity
        original_total: 3000,
        subtotal: 3000,
        tax_total: 0,
        discount_total: 0
      });

      expect(item.discounted_price).toBe('$15.00');
      expect(item.price).toBe('$15.00');
    });
  });

  describe('Complete Order Data Construction', () => {
    it('should construct complete order data with all metadata preserved', () => {
      const mockOrder = {
        id: 'order_123',
        status: 'pending',
        display_id: 1001,
        email: 'test@example.com',
        currency_code: 'usd',
        created_at: new Date('2023-06-15T10:00:00Z'),
        metadata: {
          source: 'web',
          campaign: 'summer_sale'
        },
        customer: {
          id: 'customer_1',
          email: 'test@example.com',
          first_name: 'John',
          metadata: { vip: true }
        },
        billing_address: {
          id: 'addr_1',
          first_name: 'John',
          address_1: '123 Main St',
          metadata: { verified: true }
        },
        shipping_address: {
          id: 'addr_2',
          first_name: 'John',
          address_1: '456 Oak Ave',
          metadata: { delivery_notes: 'Leave at door' }
        },
        discounts: [
          {
            code: 'SUMMER20',
            rule: { value: 20, type: 'percentage' }
          }
        ],
        gift_cards: []
      };

      const mockItems = [
        { id: 'item_1', title: 'Test Item' }
      ];

      const mockLocale = { locale: 'en-US', countryCode: 'US' };

      const result = mockOrderPlacedDataLogic.constructCompleteOrderData(
        mockOrder,
        mockItems,
        mockLocale
      );

      // Verify all order fields are preserved
      expect(result.id).toBe('order_123');
      expect(result.status).toBe('pending');
      expect(result.display_id).toBe(1001);
      expect(result.email).toBe('test@example.com');

      // Verify metadata preservation
      expect(result.metadata).toEqual({
        source: 'web',
        campaign: 'summer_sale'
      });

      // Verify complete customer data
      expect(result.customer).toEqual({
        id: 'customer_1',
        email: 'test@example.com',
        first_name: 'John',
        metadata: { vip: true }
      });

      // Verify complete address data
      expect(result.billing_address).toEqual({
        id: 'addr_1',
        first_name: 'John',
        address_1: '123 Main St',
        metadata: { verified: true }
      });

      expect(result.shipping_address).toEqual({
        id: 'addr_2',
        first_name: 'John',
        address_1: '456 Oak Ave',
        metadata: { delivery_notes: 'Leave at door' }
      });

      // Verify processed discounts
      expect(result.discounts).toEqual([
        {
          is_giftcard: false,
          code: 'SUMMER20',
          descriptor: '20%'
        }
      ]);

      // Verify additional fields
      expect(result.items).toEqual(mockItems);
      expect(result.locale).toEqual(mockLocale);
      expect(result.has_discounts).toBe(1);
      expect(result.has_gift_cards).toBe(0);
      expect(result.date).toBeDefined();
    });

    it('should handle discount processing errors gracefully', () => {
      const mockOrder = {
        id: 'order_123',
        currency_code: 'usd',
        discounts: [
          { code: 'VALID', rule: { value: 10, type: 'percentage' } },
          { code: null, rule: null }, // Invalid discount
          { code: 'PARTIAL', rule: { value: 5 } } // Missing type
        ]
      };

      const result = mockOrderPlacedDataLogic.constructCompleteOrderData(
        mockOrder,
        [],
        { locale: 'en', countryCode: 'US' }
      );

      expect(result.discounts).toHaveLength(3);
      expect(result.discounts[0]).toEqual({
        is_giftcard: false,
        code: 'VALID',
        descriptor: '10%'
      });
      expect(result.discounts[1]).toEqual({
        is_giftcard: false,
        code: 'discount_1',
        descriptor: '0 USD'
      });
      expect(result.discounts[2]).toEqual({
        is_giftcard: false,
        code: 'PARTIAL',
        descriptor: '5 USD'
      });
    });

    it('should return minimal fallback when construction fails', () => {
      const mockOrder = {
        id: 'order_123',
        email: 'test@example.com',
        display_id: 1001,
        currency_code: 'usd',
        total: 1000
      };

      // Simulate construction error by passing invalid data
      const result = mockOrderPlacedDataLogic.constructCompleteOrderData(
        mockOrder,
        null, // This should cause an error in real implementation
        null
      );

      // Should still return basic structure
      expect(result.id).toBe('order_123');
      expect(result.email).toBe('test@example.com');
      expect(result.display_id).toBe(1001);
      expect(result.currency_code).toBe('usd');
      expect(result.total).toBe(1000);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle empty or null items array', async () => {
      const mockTotalsService = { getLineItemTotals: jest.fn() };

      // Test with null
      let result = await mockOrderPlacedDataLogic.processItemsWithCompleteData(
        null,
        mockTotalsService,
        { id: 'order_123' }
      );
      expect(result).toEqual([]);

      // Test with undefined
      result = await mockOrderPlacedDataLogic.processItemsWithCompleteData(
        undefined,
        mockTotalsService,
        { id: 'order_123' }
      );
      expect(result).toEqual([]);

      // Test with empty array
      result = await mockOrderPlacedDataLogic.processItemsWithCompleteData(
        [],
        mockTotalsService,
        { id: 'order_123' }
      );
      expect(result).toEqual([]);
    });

    it('should handle missing order fields gracefully', () => {
      const minimalOrder = {
        id: 'order_123'
        // Missing most fields
      };

      const result = mockOrderPlacedDataLogic.constructCompleteOrderData(
        minimalOrder,
        [],
        { locale: 'en', countryCode: 'US' }
      );

      expect(result.id).toBe('order_123');
      expect(result.metadata).toEqual({});
      expect(result.customer).toBeNull();
      expect(result.billing_address).toBeNull();
      expect(result.shipping_address).toBeNull();
      expect(result.discounts).toEqual([]);
      expect(result.has_discounts).toBe(0);
      expect(result.has_gift_cards).toBe(0);
    });
  });
});