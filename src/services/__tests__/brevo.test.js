import BrevoService from '../brevo.js';

// Mock dependencies
const mockOrderService = {
  retrieve: jest.fn()
};

const mockTotalsService = {
  getLineItemTotals: jest.fn()
};

const mockCartService = {
  retrieve: jest.fn()
};

describe('BrevoService - Item Data Preservation', () => {
  let brevoService;

  beforeEach(() => {
    // Create service instance with mocked dependencies
    brevoService = new BrevoService(
      {
        manager: {},
        orderRepository: {},
        cartRepository: {},
        lineItemRepository: {},
        orderService: mockOrderService,
        cartService: mockCartService,
        fulfillmentService: {},
        totalsService: mockTotalsService,
        giftCardService: {}
      },
      {
        api_key: 'test-key',
        from_email: 'test@example.com',
        from_name: 'Test'
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('orderPlacedData', () => {
    it('should preserve complete item data structure including metadata and variant information', async () => {
      // Mock order data with complete item structure
      const mockOrder = {
        id: 'order_123',
        currency_code: 'usd',
        tax_total: 100,
        shipping_total: 50,
        gift_card_total: 0,
        total: 1000,
        cart_id: 'cart_123',
        created_at: new Date(),
        discounts: [],
        gift_cards: [],
        items: [
          {
            id: 'item_1',
            quantity: 2,
            unit_price: 500,
            thumbnail: 'http://example.com/thumb.jpg',
            metadata: {
              price_attributes: {
                custom_price: true,
                discount_applied: 10
              },
              custom_field: 'custom_value'
            },
            variant: {
              id: 'variant_1',
              title: 'Test Variant',
              metadata: {
                size: 'large',
                color: 'blue',
                price_attributes: {
                  bulk_discount: true
                }
              },
              product: {
                id: 'product_1',
                title: 'Test Product',
                description: 'A test product description',
                thumbnail: 'http://example.com/product-thumb.jpg',
                images: [
                  { url: 'http://example.com/image1.jpg' },
                  { url: 'http://example.com/image2.jpg' }
                ],
                metadata: {
                  category: 'electronics',
                  brand: 'TestBrand',
                  specifications: {
                    weight: '1kg',
                    dimensions: '10x10x10'
                  }
                },
                profiles: [
                  { id: 'profile_1', name: 'default' }
                ]
              }
            },
            adjustments: [
              { id: 'adj_1', amount: -50 }
            ],
            tax_lines: [
              { id: 'tax_1', rate: 0.1 }
            ]
          }
        ]
      };

      // Mock cart context for locale extraction
      const mockCart = {
        id: 'cart_123',
        context: {
          locale: 'en-US',
          countryCode: 'US'
        }
      };

      // Mock totals calculation
      const mockTotals = {
        total: 900,
        original_total: 1000,
        subtotal: 800
      };

      // Setup mocks
      mockOrderService.retrieve.mockResolvedValue(mockOrder);
      mockCartService.retrieve.mockResolvedValue(mockCart);
      mockTotalsService.getLineItemTotals.mockResolvedValue(mockTotals);

      // Execute the method
      const result = await brevoService.orderPlacedData({ id: 'order_123' });

      // Verify that complete item data is preserved
      expect(result.items).toHaveLength(1);
      const processedItem = result.items[0];

      // Check that all original item fields are preserved
      expect(processedItem.id).toBe('item_1');
      expect(processedItem.quantity).toBe(2);
      expect(processedItem.unit_price).toBe(500);

      // Check that item metadata is preserved
      expect(processedItem.metadata).toEqual({
        price_attributes: {
          custom_price: true,
          discount_applied: 10
        },
        custom_field: 'custom_value'
      });
      expect(processedItem.price_attributes).toEqual({
        custom_price: true,
        discount_applied: 10
      });

      // Check that variant data including metadata is preserved
      expect(processedItem.variant).toBeDefined();
      expect(processedItem.variant.id).toBe('variant_1');
      expect(processedItem.variant.title).toBe('Test Variant');
      expect(processedItem.variant.metadata).toEqual({
        size: 'large',
        color: 'blue',
        price_attributes: {
          bulk_discount: true
        }
      });
      expect(processedItem.variant.price_attributes).toEqual({
        bulk_discount: true
      });

      // Check that complete product information is preserved
      expect(processedItem.variant.product).toBeDefined();
      expect(processedItem.variant.product.id).toBe('product_1');
      expect(processedItem.variant.product.title).toBe('Test Product');
      expect(processedItem.variant.product.description).toBe('A test product description');
      expect(processedItem.variant.product.images).toEqual([
        { url: 'http://example.com/image1.jpg' },
        { url: 'http://example.com/image2.jpg' }
      ]);
      expect(processedItem.variant.product.metadata).toEqual({
        category: 'electronics',
        brand: 'TestBrand',
        specifications: {
          weight: '1kg',
          dimensions: '10x10x10'
        }
      });
      expect(processedItem.variant.product.profiles).toEqual([
        { id: 'profile_1', name: 'default' }
      ]);

      // Check that adjustments and tax_lines are preserved
      expect(processedItem.adjustments).toEqual([
        { id: 'adj_1', amount: -50 }
      ]);
      expect(processedItem.tax_lines).toEqual([
        { id: 'tax_1', rate: 0.1 }
      ]);

      // Check that calculated fields are added
      expect(processedItem.totals).toEqual(mockTotals);
      expect(processedItem.discounted_price).toBeDefined();
      expect(processedItem.price).toBeDefined();
      expect(processedItem.thumbnail).toBe('http://example.com/thumb.jpg');
    });

    it('should handle items with missing variant or product data gracefully', async () => {
      const mockOrder = {
        id: 'order_123',
        currency_code: 'usd',
        tax_total: 100,
        shipping_total: 50,
        gift_card_total: 0,
        total: 1000,
        cart_id: 'cart_123',
        created_at: new Date(),
        discounts: [],
        gift_cards: [],
        items: [
          {
            id: 'item_1',
            quantity: 1,
            unit_price: 500,
            metadata: null,
            variant: null,
            adjustments: null,
            tax_lines: null
          }
        ]
      };

      const mockCart = {
        id: 'cart_123',
        context: { locale: 'en-US', countryCode: 'US' }
      };

      const mockTotals = {
        total: 500,
        original_total: 500,
        subtotal: 500
      };

      mockOrderService.retrieve.mockResolvedValue(mockOrder);
      mockCartService.retrieve.mockResolvedValue(mockCart);
      mockTotalsService.getLineItemTotals.mockResolvedValue(mockTotals);

      const result = await brevoService.orderPlacedData({ id: 'order_123' });

      const processedItem = result.items[0];
      
      // Check that null/missing data is handled gracefully
      expect(processedItem.variant).toBeNull();
      expect(processedItem.metadata).toEqual({});
      expect(processedItem.price_attributes).toBeNull();
      expect(processedItem.adjustments).toEqual([]);
      expect(processedItem.tax_lines).toEqual([]);
      
      // Check that calculated fields are still added
      expect(processedItem.totals).toEqual(mockTotals);
      expect(processedItem.discounted_price).toBeDefined();
      expect(processedItem.price).toBeDefined();
    });
  });
});