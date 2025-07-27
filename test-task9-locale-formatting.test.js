import BrevoService from './src/services/brevo.js';

// Mock dependencies
const mockOrderService = {
  retrieve: jest.fn()
};

const mockCartService = {
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

describe('Task 9: Locale and Formatting Handling', () => {
  let brevoService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    brevoService = new BrevoService({
      manager: {},
      orderRepository: {},
      cartRepository: {},
      lineItemRepository: {},
      orderService: mockOrderService,
      cartService: mockCartService,
      fulfillmentService: {},
      totalsService: mockTotalsService,
      giftCardService: {}
    }, mockOptions);
  });

  test('should include enhanced locale information in order data', async () => {
    const mockOrder = {
      id: 'order_123',
      display_id: 1001,
      email: 'customer@example.com',
      currency_code: 'USD',
      tax_rate: 0.1,
      created_at: new Date('2024-01-15T10:30:00Z'),
      updated_at: new Date('2024-01-15T11:00:00Z'),
      cart_id: 'cart_123',
      total: 10000,
      subtotal: 9000,
      tax_total: 900,
      shipping_total: 500,
      discount_total: 400,
      gift_card_total: 0,
      items: [],
      discounts: [],
      gift_cards: [],
      customer: { id: 'cust_123', email: 'customer@example.com' },
      billing_address: { id: 'addr_123' },
      shipping_address: { id: 'addr_124' },
      region: {
        id: 'reg_123',
        currency_code: 'USD',
        tax_rate: 0.1,
        includes_tax: false,
        metadata: { region_type: 'domestic' }
      },
      metadata: { order_source: 'web' }
    };

    const mockCart = {
      id: 'cart_123',
      context: {
        locale: 'en-US',
        countryCode: 'US'
      }
    };

    mockOrderService.retrieve.mockResolvedValue(mockOrder);
    mockCartService.retrieve.mockResolvedValue(mockCart);

    const result = await brevoService.orderPlacedData({ id: 'order_123' });

    // Test that locale information is properly extracted and included
    expect(result.locale).toEqual({
      locale: 'en-US',
      countryCode: 'US'
    });

    // Test that region_info includes comprehensive regional data
    expect(result.region_info).toBeDefined();
    expect(result.region_info.currency_code).toBe('USD');
    expect(result.region_info.region).toEqual(mockOrder.region);
    expect(result.region_info.locale_info).toBeDefined();
    expect(result.region_info.locale_info.locale).toBe('en-US');
    expect(result.region_info.locale_info.country_code).toBe('US');
    expect(result.region_info.locale_info.currency_code).toBe('USD');

    // Test that date formatting includes both raw and formatted values
    expect(result.date_raw).toEqual(mockOrder.created_at);
    expect(result.created_at_formatted).toBeDefined();
    expect(result.updated_at_formatted).toBeDefined();

    // Test that price formatting includes both raw and formatted values
    expect(result.total_raw).toBe(10000);
    expect(result.total).toContain('USD');
    expect(result.subtotal_raw).toBe(9000);
    expect(result.subtotal).toContain('USD');
    expect(result.tax_total_raw).toBe(900);
    expect(result.tax_total).toContain('USD');

    // Test that currency information is included
    expect(result.currency).toBeDefined();
    expect(result.currency.code).toBe('USD');
    expect(result.currency.symbol).toBeDefined();
    expect(result.currency.formatted_sample).toBeDefined();
    expect(result.currency.locale_specific_format).toBeDefined();
  });

  test('should handle missing locale gracefully with fallback', async () => {
    const mockOrder = {
      id: 'order_123',
      display_id: 1001,
      email: 'customer@example.com',
      currency_code: 'EUR',
      tax_rate: 0.2,
      created_at: new Date('2024-01-15T10:30:00Z'),
      cart_id: 'cart_123',
      total: 5000,
      subtotal: 4000,
      tax_total: 800,
      shipping_total: 200,
      discount_total: 0,
      gift_card_total: 0,
      items: [],
      discounts: [],
      gift_cards: [],
      customer: null,
      billing_address: null,
      shipping_address: null,
      region: null,
      metadata: {}
    };

    const mockCart = {
      id: 'cart_123',
      context: {} // No locale information
    };

    mockOrderService.retrieve.mockResolvedValue(mockOrder);
    mockCartService.retrieve.mockResolvedValue(mockCart);

    const result = await brevoService.orderPlacedData({ id: 'order_123' });

    // Test fallback locale information
    expect(result.locale).toEqual({
      locale: null,
      countryCode: null
    });

    // Test that region_info still includes fallback data
    expect(result.region_info).toBeDefined();
    expect(result.region_info.currency_code).toBe('EUR');
    expect(result.region_info.locale_info.locale).toBe('en');
    expect(result.region_info.locale_info.country_code).toBe('US');
    expect(result.region_info.locale_info.currency_code).toBe('EUR');

    // Test that currency information uses fallback locale
    expect(result.currency).toBeDefined();
    expect(result.currency.code).toBe('EUR');
    expect(result.currency.symbol).toBeDefined();
  });

  test('should include date and number format information', async () => {
    const mockOrder = {
      id: 'order_123',
      display_id: 1001,
      email: 'customer@example.com',
      currency_code: 'GBP',
      tax_rate: 0.2,
      created_at: new Date('2024-01-15T10:30:00Z'),
      cart_id: 'cart_123',
      total: 7500,
      subtotal: 6000,
      tax_total: 1200,
      shipping_total: 300,
      discount_total: 0,
      gift_card_total: 0,
      items: [],
      discounts: [],
      gift_cards: [],
      customer: null,
      billing_address: null,
      shipping_address: null,
      region: {
        currency_code: 'GBP',
        tax_rate: 0.2,
        includes_tax: true
      },
      metadata: {}
    };

    const mockCart = {
      id: 'cart_123',
      context: {
        locale: 'en-GB',
        countryCode: 'GB'
      }
    };

    mockOrderService.retrieve.mockResolvedValue(mockOrder);
    mockCartService.retrieve.mockResolvedValue(mockCart);

    const result = await brevoService.orderPlacedData({ id: 'order_123' });

    // Test that locale-specific formatting information is included
    expect(result.region_info.locale_info.date_format).toBeDefined();
    expect(result.region_info.locale_info.date_format.locale).toBe('en-GB');
    expect(result.region_info.locale_info.date_format.sample_format).toBeDefined();

    expect(result.region_info.locale_info.number_format).toBeDefined();
    expect(result.region_info.locale_info.number_format.locale).toBe('en-GB');
    expect(result.region_info.locale_info.number_format.currency_code).toBe('GBP');
    expect(result.region_info.locale_info.number_format.sample_currency_format).toBeDefined();

    // Test that currency formatting uses the correct locale
    expect(result.currency.locale_specific_format).toBeDefined();
    expect(result.currency.code).toBe('GBP');
  });

  test('helper methods should work correctly', () => {
    // Test getDateFormatForLocale
    const dateFormat = brevoService.getDateFormatForLocale('en-US');
    expect(dateFormat.locale).toBe('en-US');
    expect(dateFormat.sample_format).toBeDefined();
    expect(dateFormat.options).toBeDefined();

    // Test getNumberFormatForLocale
    const numberFormat = brevoService.getNumberFormatForLocale('en-US', 'USD');
    expect(numberFormat.locale).toBe('en-US');
    expect(numberFormat.currency_code).toBe('USD');
    expect(numberFormat.sample_currency_format).toBeDefined();
    expect(numberFormat.sample_number_format).toBeDefined();

    // Test getCurrencySymbol
    const symbol = brevoService.getCurrencySymbol('USD', 'en-US');
    expect(symbol).toBeDefined();
    expect(typeof symbol).toBe('string');
  });

  test('should handle errors in helper methods gracefully', () => {
    // Test with invalid locale
    const dateFormat = brevoService.getDateFormatForLocale('invalid-locale');
    expect(dateFormat.locale).toBe('en');
    expect(dateFormat.sample_format).toBeDefined();

    // Test with invalid currency
    const numberFormat = brevoService.getNumberFormatForLocale('en', 'INVALID');
    expect(numberFormat.locale).toBe('en');
    expect(numberFormat.currency_code).toBe('INVALID');

    // Test getCurrencySymbol with invalid inputs
    const symbol = brevoService.getCurrencySymbol('INVALID', 'invalid-locale');
    expect(symbol).toBe('INVALID'); // Should fallback to currency code
  });
});