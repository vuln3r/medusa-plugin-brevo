const { BrevoService } = require('./src/services/brevo');

// Mock dependencies
const mockOrderService = {
  retrieve: jest.fn()
};

const mockTotalsService = {
  getLineItemTotals: jest.fn()
};

const mockOptions = {
  api_key: 'test-key',
  from_email: 'test@example.com',
  from_name: 'Test Store',
  events: {
    order: {
      placed: 123
    }
  }
};

describe('BrevoService - Task 6: Error Handling and Fallback Mechanisms', () => {
  let brevoService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    brevoService = new BrevoService({
      manager: {},
      orderRepository: {},
      cartRepository: {},
      lineItemRepository: {},
      orderService: mockOrderService,
      cartService: {},
      fulfillmentService: {},
      totalsService: mockTotalsService,
      giftCardService: {}
    }, mockOptions);

    // Mock the extractLocale method
    brevoService.extractLocale = jest.fn().mockResolvedValue({
      locale: 'en',
      countryCode: 'US'
    });

    // Mock the humanPrice_ method
    brevoService.humanPrice_ = jest.fn((amount, currency) => amount.toFixed(2));

    // Mock the normalizeThumbUrl_ method
    brevoService.normalizeThumbUrl_ = jest.fn(url => url);

    // Mock the processItems_ method
    brevoService.processItems_ = jest.fn((items, taxRate, currency) => 
      items.map(item => ({
        ...item,
        price: `${currency} ${item.unit_price}`,
        thumbnail: item.thumbnail
      }))
    );
  });

  test('should handle enhanced data retrieval failure and fallback to minimal data', async () => {
    const orderId = 'order_123';
    const minimalOrder = {
      id: orderId,
      email: 'test@example.com',
      display_id: 1001,
      currency_code: 'usd',
      tax_rate: 10,
      created_at: new Date(),
      shipping_total: 500,
      discount_total: 100,
      tax_total: 200,
      gift_card_total: 0,
      subtotal: 1000,
      total: 1600,
      discounts: [],
      gift_cards: [],
      items: [{
        id: 'item_1',
        unit_price: 1000,
        quantity: 1,
        metadata: {}
      }]
    };

    // Mock enhanced retrieval to fail
    mockOrderService.retrieve
      .mockRejectedValueOnce(new Error('Enhanced retrieval failed'))
      .mockResolvedValueOnce(minimalOrder);

    mockTotalsService.getLineItemTotals.mockResolvedValue({
      total: 1000,
      original_total: 1000,
      subtotal: 1000,
      tax_total: 0,
      discount_total: 0
    });

    const result = await brevoService.orderPlacedData({ id: orderId });

    expect(result).toBeDefined();
    expect(result.id).toBe(orderId);
    expect(result.email).toBe('test@example.com');
    expect(mockOrderService.retrieve).toHaveBeenCalledTimes(2);
  });

  test('should handle complete data retrieval failure gracefully', async () => {
    const orderId = 'order_123';

    // Mock both enhanced and minimal retrieval to fail
    mockOrderService.retrieve
      .mockRejectedValueOnce(new Error('Enhanced retrieval failed'))
      .mockRejectedValueOnce(new Error('Minimal retrieval failed'));

    await expect(brevoService.orderPlacedData({ id: orderId }))
      .rejects.toThrow('Unable to retrieve order data for order order_123');

    expect(mockOrderService.retrieve).toHaveBeenCalledTimes(2);
  });

  test('should handle item processing failures gracefully', async () => {
    const orderId = 'order_123';
    const orderWithBadItems = {
      id: orderId,
      email: 'test@example.com',
      display_id: 1001,
      currency_code: 'usd',
      tax_rate: 10,
      created_at: new Date(),
      shipping_total: 500,
      discount_total: 100,
      tax_total: 200,
      gift_card_total: 0,
      subtotal: 1000,
      total: 1600,
      discounts: [],
      gift_cards: [],
      items: [{
        id: 'item_1',
        unit_price: 1000,
        quantity: 1,
        metadata: {},
        variant: null // This might cause issues
      }]
    };

    mockOrderService.retrieve.mockResolvedValue(orderWithBadItems);
    
    // Mock totals service to fail for some items
    mockTotalsService.getLineItemTotals.mockRejectedValue(new Error('Totals calculation failed'));

    const result = await brevoService.orderPlacedData({ id: orderId });

    expect(result).toBeDefined();
    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  test('should handle missing relations gracefully', async () => {
    const orderId = 'order_123';
    const orderWithMissingRelations = {
      id: orderId,
      email: 'test@example.com',
      display_id: 1001,
      currency_code: 'usd',
      tax_rate: 10,
      created_at: new Date(),
      shipping_total: 500,
      discount_total: 100,
      tax_total: 200,
      gift_card_total: 0,
      subtotal: 1000,
      total: 1600,
      discounts: null, // Missing relation
      gift_cards: undefined, // Missing relation
      items: null, // Missing relation
      customer: null,
      billing_address: null,
      shipping_address: null
    };

    mockOrderService.retrieve.mockResolvedValue(orderWithMissingRelations);

    const result = await brevoService.orderPlacedData({ id: orderId });

    expect(result).toBeDefined();
    expect(result.items).toEqual([]);
    expect(result.discounts).toEqual([]);
    expect(result.has_discounts).toBe(0);
    expect(result.has_gift_cards).toBe(0);
    expect(result.customer).toBeNull();
    expect(result.billing_address).toBeNull();
    expect(result.shipping_address).toBeNull();
  });

  test('should handle locale extraction failure', async () => {
    const orderId = 'order_123';
    const order = {
      id: orderId,
      email: 'test@example.com',
      display_id: 1001,
      currency_code: 'usd',
      tax_rate: 10,
      created_at: new Date(),
      shipping_total: 500,
      discount_total: 100,
      tax_total: 200,
      gift_card_total: 0,
      subtotal: 1000,
      total: 1600,
      discounts: [],
      gift_cards: [],
      items: []
    };

    mockOrderService.retrieve.mockResolvedValue(order);
    brevoService.extractLocale.mockRejectedValue(new Error('Locale extraction failed'));

    const result = await brevoService.orderPlacedData({ id: orderId });

    expect(result).toBeDefined();
    expect(result.locale).toEqual({
      locale: 'en',
      countryCode: 'US'
    });
  });

  test('should handle discount processing failures', async () => {
    const orderId = 'order_123';
    const orderWithBadDiscounts = {
      id: orderId,
      email: 'test@example.com',
      display_id: 1001,
      currency_code: 'usd',
      tax_rate: 10,
      created_at: new Date(),
      shipping_total: 500,
      discount_total: 100,
      tax_total: 200,
      gift_card_total: 0,
      subtotal: 1000,
      total: 1600,
      discounts: [
        { code: 'VALID10', rule: { value: 10, type: 'percentage' } },
        { code: null, rule: null }, // Bad discount
        { code: 'VALID20', rule: { value: 20, type: 'fixed' } }
      ],
      gift_cards: [
        { code: 'GIFT100', value: 100 },
        { code: null, value: null } // Bad gift card
      ],
      items: []
    };

    mockOrderService.retrieve.mockResolvedValue(orderWithBadDiscounts);

    const result = await brevoService.orderPlacedData({ id: orderId });

    expect(result).toBeDefined();
    expect(result.discounts).toBeDefined();
    expect(Array.isArray(result.discounts)).toBe(true);
    expect(result.discounts.length).toBe(3); // Should handle bad discount gracefully
  });

  test('should handle final data construction failure', async () => {
    const orderId = 'order_123';
    const order = {
      id: orderId,
      email: 'test@example.com',
      display_id: 1001,
      currency_code: 'usd',
      tax_rate: 10,
      created_at: new Date(),
      shipping_total: 500,
      discount_total: 100,
      tax_total: 200,
      gift_card_total: 0,
      subtotal: 1000,
      total: 1600,
      discounts: [],
      gift_cards: [],
      items: []
    };

    mockOrderService.retrieve.mockResolvedValue(order);
    
    // Mock humanPrice_ to throw error during final construction
    brevoService.humanPrice_.mockImplementation(() => {
      throw new Error('Price formatting failed');
    });

    const result = await brevoService.orderPlacedData({ id: orderId });

    expect(result).toBeDefined();
    expect(result.id).toBe(orderId);
    expect(result.email).toBe('test@example.com');
    // Should return minimal fallback structure
    expect(result.items).toEqual([]);
    expect(result.discounts).toEqual([]);
  });
});