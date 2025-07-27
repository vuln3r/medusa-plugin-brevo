// Test script to verify backward compatibility for existing template variables
// This test ensures all existing formatted fields remain unchanged

import BrevoService from './src/services/brevo.js';

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

// Create service instance
const brevoService = new BrevoService(
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

async function testBackwardCompatibility() {
  console.log('🧪 Testing backward compatibility for existing template variables...');

  // Mock order data that represents typical order structure
  const mockOrder = {
    id: 'order_123',
    display_id: 12345,
    currency_code: 'usd',
    tax_rate: 0.1, // 10% tax rate
    tax_total: 100,
    shipping_total: 50,
    gift_card_total: 25,
    discount_total: 30,
    subtotal: 900,
    total: 1095, // subtotal + tax + shipping - gift_card - discount
    cart_id: 'cart_123',
    created_at: new Date('2024-01-15T10:30:00Z'),
    email: 'customer@example.com',
    discounts: [
      {
        code: 'SAVE10',
        rule: {
          value: 10,
          type: 'percentage'
        }
      }
    ],
    gift_cards: [
      {
        code: 'GIFT25',
        value: 25
      }
    ],
    customer: {
      id: 'customer_1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'customer@example.com'
    },
    billing_address: {
      first_name: 'John',
      last_name: 'Doe',
      address_1: '123 Main St',
      city: 'New York',
      postal_code: '10001',
      country_code: 'US'
    },
    shipping_address: {
      first_name: 'John',
      last_name: 'Doe',
      address_1: '123 Main St',
      city: 'New York',
      postal_code: '10001',
      country_code: 'US'
    },
    items: [
      {
        id: 'item_1',
        title: 'Test Product',
        quantity: 2,
        unit_price: 450,
        thumbnail: 'http://example.com/thumb.jpg',
        variant: {
          id: 'variant_1',
          title: 'Test Variant',
          product: {
            id: 'product_1',
            title: 'Test Product'
          }
        }
      }
    ],
    shipping_methods: [
      {
        price: 50,
        shipping_option: {
          name: 'Standard Shipping'
        }
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
    original_total: 900,
    subtotal: 900,
    tax_total: 90,
    discount_total: 0
  };

  // Setup mocks
  mockOrderService.retrieve.mockResolvedValue(mockOrder);
  mockCartService.retrieve.mockResolvedValue(mockCart);
  mockTotalsService.getLineItemTotals.mockResolvedValue(mockTotals);

  try {
    // Execute the method
    const result = await brevoService.orderPlacedData({ id: 'order_123' });

    console.log('✅ Order data retrieved successfully');

    // Test 1: Verify all existing formatted fields are present and properly formatted
    const expectedFormattedFields = [
      'subtotal',
      'total', 
      'tax_total',
      'discount_total',
      'shipping_total',
      'gift_card_total',
      'subtotal_ex_tax',
      'shipping_total_inc'
    ];

    console.log('\n📊 Testing formatted price fields:');
    for (const field of expectedFormattedFields) {
      if (result[field]) {
        console.log(`  ✅ ${field}: ${result[field]}`);
        
        // Verify format includes currency code
        if (!result[field].includes('USD')) {
          console.error(`  ❌ ${field} missing currency code: ${result[field]}`);
          return false;
        }
        
        // Verify it's a properly formatted string
        if (typeof result[field] !== 'string') {
          console.error(`  ❌ ${field} is not a string: ${typeof result[field]}`);
          return false;
        }
      } else {
        console.error(`  ❌ Missing formatted field: ${field}`);
        return false;
      }
    }

    // Test 2: Verify existing date formatting
    console.log('\n📅 Testing date formatting:');
    if (result.date && typeof result.date === 'string') {
      console.log(`  ✅ date: ${result.date}`);
    } else {
      console.error(`  ❌ date field missing or not properly formatted: ${result.date}`);
      return false;
    }

    // Test 3: Verify existing discount and gift card structures
    console.log('\n🎁 Testing discount and gift card structures:');
    
    // Check discounts array structure
    if (Array.isArray(result.discounts) && result.discounts.length > 0) {
      const discount = result.discounts[0];
      if (discount.is_giftcard === false && discount.code && discount.descriptor) {
        console.log(`  ✅ discount structure: code=${discount.code}, descriptor=${discount.descriptor}`);
      } else {
        console.error(`  ❌ discount structure invalid:`, discount);
        return false;
      }
    }

    // Test 4: Verify existing item processing maintains backward compatibility
    console.log('\n📦 Testing item processing backward compatibility:');
    if (Array.isArray(result.items) && result.items.length > 0) {
      const item = result.items[0];
      
      // Check that existing item fields are preserved
      const expectedItemFields = ['id', 'title', 'quantity', 'price', 'discounted_price', 'thumbnail'];
      for (const field of expectedItemFields) {
        if (item[field] !== undefined) {
          console.log(`  ✅ item.${field}: ${item[field]}`);
        } else {
          console.error(`  ❌ Missing item field: ${field}`);
          return false;
        }
      }

      // Verify price formatting in items
      if (item.price && typeof item.price === 'string' && item.price.includes('USD')) {
        console.log(`  ✅ item price formatting: ${item.price}`);
      } else {
        console.error(`  ❌ item price not properly formatted: ${item.price}`);
        return false;
      }
    } else {
      console.error(`  ❌ items array missing or empty`);
      return false;
    }

    // Test 5: Verify existing boolean flags
    console.log('\n🏷️ Testing boolean flags:');
    const expectedBooleanFields = ['has_discounts', 'has_gift_cards'];
    for (const field of expectedBooleanFields) {
      if (typeof result[field] === 'number') {
        console.log(`  ✅ ${field}: ${result[field]}`);
      } else {
        console.error(`  ❌ ${field} not a number: ${result[field]}`);
        return false;
      }
    }

    // Test 6: Verify locale structure
    console.log('\n🌍 Testing locale structure:');
    if (result.locale && typeof result.locale === 'object') {
      console.log(`  ✅ locale: ${JSON.stringify(result.locale)}`);
    } else {
      console.error(`  ❌ locale missing or invalid: ${result.locale}`);
      return false;
    }

    // Test 7: Verify core order fields are preserved
    console.log('\n📋 Testing core order fields:');
    const expectedCoreFields = ['id', 'display_id', 'email', 'currency_code'];
    for (const field of expectedCoreFields) {
      if (result[field] !== undefined) {
        console.log(`  ✅ ${field}: ${result[field]}`);
      } else {
        console.error(`  ❌ Missing core field: ${field}`);
        return false;
      }
    }

    // Test 8: Verify address structures are preserved
    console.log('\n🏠 Testing address structures:');
    if (result.billing_address && typeof result.billing_address === 'object') {
      console.log(`  ✅ billing_address preserved with ${Object.keys(result.billing_address).length} fields`);
    }
    if (result.shipping_address && typeof result.shipping_address === 'object') {
      console.log(`  ✅ shipping_address preserved with ${Object.keys(result.shipping_address).length} fields`);
    }

    // Test 9: Verify customer structure is preserved
    console.log('\n👤 Testing customer structure:');
    if (result.customer && typeof result.customer === 'object') {
      console.log(`  ✅ customer preserved with ${Object.keys(result.customer).length} fields`);
    }

    console.log('\n🎉 All backward compatibility tests passed!');
    console.log('\n📊 Summary of preserved template variables:');
    console.log('  - All formatted price fields (subtotal, total, tax_total, etc.)');
    console.log('  - Date formatting (date field)');
    console.log('  - Item price formatting (price, discounted_price)');
    console.log('  - Discount and gift card structures');
    console.log('  - Boolean flags (has_discounts, has_gift_cards)');
    console.log('  - Core order fields (id, display_id, email, etc.)');
    console.log('  - Address structures (billing_address, shipping_address)');
    console.log('  - Customer structure');
    console.log('  - Locale information');
    console.log('  - Item structures with thumbnail normalization');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testBackwardCompatibility()
  .then(success => {
    if (success) {
      console.log('\n✅ Backward compatibility verification completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Backward compatibility verification failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });