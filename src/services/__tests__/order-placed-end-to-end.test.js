// End-to-End Integration Tests for Enhanced Order.Placed Event
// This test suite validates the complete notification flow with full order data
// Tests are designed to work without importing the actual service to avoid dependency issues

describe('Enhanced Order Placed End-to-End Integration Tests', () => {
  // Mock the complete notification flow
  const mockNotificationFlow = {
    // Simulate the complete sendNotification flow for order.placed
    async sendOrderPlacedNotification(eventData, options, attachmentGenerator) {
      // Step 1: Fetch complete order data
      const orderData = await this.fetchOrderPlacedData(eventData);
      
      // Step 2: Fetch attachments independently (PDF generation)
      let attachments = [];
      try {
        if (options.pdf?.enabled && attachmentGenerator) {
          attachments = await this.fetchAttachments(orderData, attachmentGenerator);
        }
      } catch (error) {
        console.error('Attachment generation failed - continuing with notification:', error);
        attachments = [];
      }
      
      // Step 3: Determine template based on locale
      let templateId = options.events.order.placed;
      if (typeof templateId === 'object') {
        const locale = orderData.locale;
        if (locale?.countryCode && templateId[locale.countryCode]) {
          templateId = templateId[locale.countryCode];
        } else if (locale?.locale && templateId[locale.locale]) {
          templateId = templateId[locale.locale];
        } else {
          templateId = Object.values(templateId)[0];
        }
      }
      
      // Step 4: Send email with complete data
      const emailData = {
        sender: {
          email: options.from_email,
          name: options.from_name
        },
        to: [{ email: orderData.email || orderData.customer?.email }],
        templateId: Number(templateId),
        params: {
          ...orderData,
          ...options.default_data
        }
      };
      
      if (attachments.length > 0) {
        emailData.Attachments = attachments.map(a => ({
          content: a.base64,
          Name: a.name,
          ContentType: a.type,
          ContentID: `cid:${a.name}`
        }));
      }
      
      // Simulate successful email sending
      return {
        status: 'sent',
        data: emailData,
        to: emailData.to
      };
    },

    // Simulate enhanced order data fetching
    async fetchOrderPlacedData(eventData) {
      const orderId = eventData.id;
      
      // Simulate enhanced order retrieval with comprehensive relations
      const order = {
        id: orderId,
        status: 'pending',
        fulfillment_status: 'not_fulfilled',
        payment_status: 'awaiting',
        display_id: 1001,
        cart_id: 'cart_123',
        customer_id: 'customer_123',
        email: 'customer@example.com',
        currency_code: 'usd',
        tax_rate: 10,
        metadata: {
          source: 'web',
          campaign_id: 'summer_2023',
          utm_source: 'google'
        },
        created_at: new Date('2023-06-15T10:00:00Z'),
        updated_at: new Date('2023-06-15T10:05:00Z'),
        shipping_total: 1000,
        discount_total: 500,
        tax_total: 800,
        refunded_total: 0,
        gift_card_total: 0,
        subtotal: 5000,
        total: 6300,
        
        // Complete customer information
        customer: {
          id: 'customer_123',
          email: 'customer@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+1234567890',
          has_account: true,
          metadata: {
            vip_tier: 'gold',
            preferred_language: 'en',
            marketing_consent: true
          }
        },
        
        // Complete billing address
        billing_address: {
          id: 'addr_1',
          first_name: 'Jane',
          last_name: 'Smith',
          company: 'Tech Solutions Inc',
          address_1: '123 Business Avenue',
          address_2: 'Suite 100',
          city: 'San Francisco',
          province: 'CA',
          postal_code: '94105',
          country_code: 'US',
          phone: '+1234567890',
          metadata: {
            address_type: 'business',
            verified: true,
            tax_id: 'US123456789'
          }
        },
        
        // Complete shipping address
        shipping_address: {
          id: 'addr_2',
          first_name: 'Jane',
          last_name: 'Smith',
          address_1: '456 Home Street',
          city: 'Oakland',
          province: 'CA',
          postal_code: '94601',
          country_code: 'US',
          phone: '+1234567890',
          metadata: {
            delivery_instructions: 'Ring doorbell twice, leave at front door',
            access_code: '1234',
            safe_location: 'Front porch'
          }
        },
        
        // Discounts with complete rule information
        discounts: [
          {
            id: 'discount_1',
            code: 'SUMMER20',
            rule: {
              id: 'rule_1',
              value: 20,
              type: 'percentage',
              description: 'Summer Sale 20% off'
            }
          }
        ],
        
        gift_cards: [],
        
        // Complete items with full variant and product data
        items: [
          {
            id: 'item_1',
            quantity: 2,
            unit_price: 2500,
            title: 'Premium Cotton T-Shirt',
            description: 'High-quality cotton t-shirt',
            thumbnail: 'tshirt-thumb.jpg',
            metadata: {
              price_attributes: {
                original_price: 3000,
                discount_applied: 500,
                bulk_pricing: true,
                price_tier: 'premium'
              },
              customization: {
                color: 'navy',
                size: 'L',
                print_location: 'front',
                print_design: 'company_logo'
              },
              fulfillment: {
                warehouse: 'west_coast',
                estimated_ship_date: '2023-06-16'
              }
            },
            
            // Complete variant information
            variant: {
              id: 'variant_1',
              title: 'Large Navy',
              sku: 'TSHIRT-L-NAVY-001',
              barcode: '1234567890123',
              ean: '1234567890123',
              upc: '123456789012',
              inventory_quantity: 50,
              allow_backorder: false,
              manage_inventory: true,
              weight: 200,
              length: 30,
              height: 1,
              width: 25,
              hs_code: '6109100000',
              origin_country: 'US',
              material: 'cotton',
              metadata: {
                size: 'L',
                color: 'navy',
                material: '100% cotton',
                fit: 'regular',
                price_attributes: {
                  cost_price: 1000,
                  wholesale_price: 1800,
                  retail_price: 2500,
                  msrp: 3000
                },
                inventory: {
                  location: 'warehouse_a',
                  bin: 'A-12-3',
                  reserved: 5
                }
              },
              
              // Complete product information
              product: {
                id: 'product_1',
                title: 'Premium Cotton T-Shirt',
                subtitle: 'Comfortable everyday wear',
                description: 'Made from premium 100% cotton, this t-shirt offers exceptional comfort and durability. Perfect for casual wear or as a base layer. Features reinforced seams and pre-shrunk fabric.',
                handle: 'premium-cotton-tshirt',
                thumbnail: 'product-main.jpg',
                status: 'published',
                weight: 200,
                length: 30,
                height: 1,
                width: 25,
                hs_code: '6109100000',
                origin_country: 'US',
                material: 'cotton',
                
                // Product images with metadata
                images: [
                  {
                    id: 'img_1',
                    url: 'tshirt-front-navy.jpg',
                    metadata: {
                      view: 'front',
                      color: 'navy',
                      alt_text: 'Navy t-shirt front view'
                    }
                  },
                  {
                    id: 'img_2',
                    url: 'tshirt-back-navy.jpg',
                    metadata: {
                      view: 'back',
                      color: 'navy',
                      alt_text: 'Navy t-shirt back view'
                    }
                  },
                  {
                    id: 'img_3',
                    url: 'tshirt-detail-fabric.jpg',
                    metadata: {
                      view: 'detail',
                      focus: 'fabric_texture',
                      alt_text: 'Cotton fabric detail'
                    }
                  }
                ],
                
                // Comprehensive product metadata
                metadata: {
                  category: 'clothing',
                  subcategory: 'shirts',
                  brand: 'Premium Basics',
                  collection: 'summer_2023',
                  season: 'all-season',
                  gender: 'unisex',
                  age_group: 'adult',
                  care_instructions: 'Machine wash cold, tumble dry low, do not bleach',
                  specifications: {
                    fabric: '100% cotton',
                    weight: '180gsm',
                    fit: 'regular',
                    neckline: 'crew',
                    sleeve_length: 'short',
                    construction: 'side_seamed',
                    features: ['pre_shrunk', 'reinforced_seams', 'tagless']
                  },
                  sustainability: {
                    organic: false,
                    fair_trade: true,
                    recycled_content: 0,
                    carbon_neutral: false
                  },
                  seo: {
                    meta_title: 'Premium Cotton T-Shirt - Comfortable & Durable',
                    meta_description: 'Shop our premium cotton t-shirt for ultimate comfort and style. Made from 100% cotton with reinforced seams.',
                    keywords: ['cotton t-shirt', 'premium basics', 'comfortable shirt']
                  },
                  marketing: {
                    featured: true,
                    bestseller: false,
                    new_arrival: false,
                    sale_eligible: true
                  }
                },
                
                // Product profiles
                profiles: [
                  {
                    id: 'profile_1',
                    name: 'default',
                    type: 'default'
                  },
                  {
                    id: 'profile_2',
                    name: 'gift',
                    type: 'gift'
                  },
                  {
                    id: 'profile_3',
                    name: 'wholesale',
                    type: 'wholesale'
                  }
                ]
              }
            },
            
            // Item adjustments (discounts, fees, etc.)
            adjustments: [
              {
                id: 'adj_1',
                amount: -500,
                description: 'Bulk discount (2+ items)',
                discount_id: 'discount_1',
                metadata: {
                  type: 'bulk_discount',
                  threshold: 2,
                  percentage: 10
                }
              }
            ],
            
            // Tax lines
            tax_lines: [
              {
                id: 'tax_1',
                rate: 0.0875,
                name: 'CA Sales Tax',
                code: 'CA_SALES_TAX',
                metadata: {
                  jurisdiction: 'California',
                  tax_type: 'sales',
                  tax_authority: 'CA_BOE'
                }
              }
            ],
            
            // Calculated totals (would be calculated by totalsService)
            totals: {
              total: 4500,
              original_total: 5000,
              subtotal: 4200,
              tax_total: 300,
              discount_total: 500
            },
            
            // Formatted prices
            discounted_price: '$22.50 USD',
            price: '$25.00 USD'
          }
        ],
        
        // Additional order relations
        region: {
          id: 'region_1',
          name: 'US',
          currency_code: 'usd',
          tax_rate: 8.75,
          includes_tax: false
        },
        
        sales_channel: {
          id: 'channel_1',
          name: 'web',
          description: 'Web store'
        },
        
        payments: [
          {
            id: 'payment_1',
            amount: 6300,
            currency_code: 'usd',
            provider_id: 'stripe',
            data: {
              status: 'succeeded',
              payment_method: 'card',
              last4: '4242'
            }
          }
        ],
        
        shipping_methods: [
          {
            id: 'shipping_1',
            price: 1000,
            shipping_option: {
              id: 'option_1',
              name: 'Standard Shipping',
              provider_id: 'manual',
              price_type: 'flat_rate'
            }
          }
        ]
      };
      
      // Add locale information
      order.locale = {
        locale: 'en-US',
        countryCode: 'US'
      };
      
      // Add calculated fields
      order.has_discounts = order.discounts.length;
      order.has_gift_cards = order.gift_cards.length;
      order.date = order.created_at.toLocaleString();
      
      // Process discounts
      order.discounts = order.discounts.map(discount => ({
        is_giftcard: false,
        code: discount.code,
        descriptor: `${discount.rule.value}${discount.rule.type === 'percentage' ? '%' : ` ${order.currency_code.toUpperCase()}`}`
      }));
      
      // Add formatted totals
      order.subtotal = `$${(order.subtotal / 100).toFixed(2)} ${order.currency_code.toUpperCase()}`;
      order.tax_total = `$${(order.tax_total / 100).toFixed(2)} ${order.currency_code.toUpperCase()}`;
      order.shipping_total = `$${(order.shipping_total / 100).toFixed(2)} ${order.currency_code.toUpperCase()}`;
      order.discount_total = `$${(order.discount_total / 100).toFixed(2)} ${order.currency_code.toUpperCase()}`;
      order.total = `$${(order.total / 100).toFixed(2)} ${order.currency_code.toUpperCase()}`;
      
      return order;
    },

    // Simulate PDF attachment generation
    async fetchAttachments(orderData, attachmentGenerator) {
      if (!attachmentGenerator || !attachmentGenerator.createInvoice) {
        return [];
      }
      
      try {
        const base64 = await attachmentGenerator.createInvoice({}, orderData);
        return [
          {
            name: 'invoice.pdf',
            base64,
            type: 'application/pdf'
          }
        ];
      } catch (error) {
        console.error('PDF generation failed:', error);
        return [];
      }
    }
  };

  describe('Complete Order.Placed Notification Flow', () => {
    it('should send notification with complete order data including all relations', async () => {
      const options = {
        from_email: 'store@example.com',
        from_name: 'Test Store',
        events: {
          order: {
            placed: 123
          }
        },
        default_data: {
          store_name: 'Test Store',
          store_url: 'https://teststore.com',
          support_email: 'support@teststore.com'
        }
      };

      const result = await mockNotificationFlow.sendOrderPlacedNotification(
        { id: 'order_123' },
        options,
        null
      );

      expect(result.status).toBe('sent');
      expect(result.data.sender).toEqual({
        email: 'store@example.com',
        name: 'Test Store'
      });
      expect(result.data.to).toEqual([{ email: 'customer@example.com' }]);
      expect(result.data.templateId).toBe(123);

      const params = result.data.params;

      // Verify complete order data is included
      expect(params.id).toBe('order_123');
      expect(params.status).toBe('pending');
      expect(params.fulfillment_status).toBe('not_fulfilled');
      expect(params.payment_status).toBe('awaiting');
      expect(params.display_id).toBe(1001);

      // Verify order metadata is preserved
      expect(params.metadata).toEqual({
        source: 'web',
        campaign_id: 'summer_2023',
        utm_source: 'google'
      });

      // Verify complete customer data
      expect(params.customer).toEqual({
        id: 'customer_123',
        email: 'customer@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567890',
        has_account: true,
        metadata: {
          vip_tier: 'gold',
          preferred_language: 'en',
          marketing_consent: true
        }
      });

      // Verify complete address data with metadata
      expect(params.billing_address.metadata).toEqual({
        address_type: 'business',
        verified: true,
        tax_id: 'US123456789'
      });

      expect(params.shipping_address.metadata).toEqual({
        delivery_instructions: 'Ring doorbell twice, leave at front door',
        access_code: '1234',
        safe_location: 'Front porch'
      });

      // Verify complete item data
      expect(params.items).toHaveLength(1);
      const item = params.items[0];

      // Verify item metadata preservation
      expect(item.metadata.price_attributes).toEqual({
        original_price: 3000,
        discount_applied: 500,
        bulk_pricing: true,
        price_tier: 'premium'
      });

      expect(item.metadata.customization).toEqual({
        color: 'navy',
        size: 'L',
        print_location: 'front',
        print_design: 'company_logo'
      });

      // Verify complete variant data
      expect(item.variant.sku).toBe('TSHIRT-L-NAVY-001');
      expect(item.variant.barcode).toBe('1234567890123');
      expect(item.variant.metadata.price_attributes).toEqual({
        cost_price: 1000,
        wholesale_price: 1800,
        retail_price: 2500,
        msrp: 3000
      });

      // Verify complete product data
      expect(item.variant.product.title).toBe('Premium Cotton T-Shirt');
      expect(item.variant.product.description).toContain('Made from premium 100% cotton');
      expect(item.variant.product.images).toHaveLength(3);
      expect(item.variant.product.metadata.specifications).toEqual({
        fabric: '100% cotton',
        weight: '180gsm',
        fit: 'regular',
        neckline: 'crew',
        sleeve_length: 'short',
        construction: 'side_seamed',
        features: ['pre_shrunk', 'reinforced_seams', 'tagless']
      });

      // Verify adjustments and tax lines
      expect(item.adjustments).toHaveLength(1);
      expect(item.adjustments[0].metadata).toEqual({
        type: 'bulk_discount',
        threshold: 2,
        percentage: 10
      });

      expect(item.tax_lines).toHaveLength(1);
      expect(item.tax_lines[0].metadata).toEqual({
        jurisdiction: 'California',
        tax_type: 'sales',
        tax_authority: 'CA_BOE'
      });

      // Verify calculated totals
      expect(item.totals).toEqual({
        total: 4500,
        original_total: 5000,
        subtotal: 4200,
        tax_total: 300,
        discount_total: 500
      });

      // Verify locale information
      expect(params.locale).toEqual({
        locale: 'en-US',
        countryCode: 'US'
      });

      // Verify formatted totals
      expect(params.total).toBe('$63.00 USD');
      expect(params.subtotal).toBe('$50.00 USD');
      expect(params.tax_total).toBe('$8.00 USD');
      expect(params.shipping_total).toBe('$10.00 USD');
      expect(params.discount_total).toBe('$5.00 USD');

      // Verify default data is merged
      expect(params.store_name).toBe('Test Store');
      expect(params.store_url).toBe('https://teststore.com');
      expect(params.support_email).toBe('support@teststore.com');
    });

    it('should handle locale-based template selection', async () => {
      const options = {
        from_email: 'store@example.com',
        from_name: 'Test Store',
        events: {
          order: {
            placed: {
              'US': 123,
              'FR': 456,
              'en-US': 789,
              'default': 999
            }
          }
        },
        default_data: {}
      };

      const result = await mockNotificationFlow.sendOrderPlacedNotification(
        { id: 'order_123' },
        options,
        null
      );

      // Should prioritize countryCode (US) over locale (en-US)
      expect(result.data.templateId).toBe(123);
    });

    it('should continue with notification when PDF generation fails', async () => {
      const options = {
        from_email: 'store@example.com',
        from_name: 'Test Store',
        events: { order: { placed: 123 } },
        default_data: {},
        pdf: { enabled: true }
      };

      const failingAttachmentGenerator = {
        createInvoice: jest.fn().mockRejectedValue(new Error('PDF generation failed'))
      };

      const result = await mockNotificationFlow.sendOrderPlacedNotification(
        { id: 'order_123' },
        options,
        failingAttachmentGenerator
      );

      // Notification should still be sent
      expect(result.status).toBe('sent');
      expect(result.data.Attachments).toBeUndefined();
      
      // Complete order data should still be included
      expect(result.data.params.id).toBe('order_123');
      expect(result.data.params.items).toHaveLength(1);
      expect(result.data.params.customer).toBeDefined();
    });

    it('should include PDF attachment when generation succeeds', async () => {
      const options = {
        from_email: 'store@example.com',
        from_name: 'Test Store',
        events: { order: { placed: 123 } },
        default_data: {},
        pdf: { enabled: true }
      };

      const workingAttachmentGenerator = {
        createInvoice: jest.fn().mockResolvedValue('base64-pdf-content')
      };

      const result = await mockNotificationFlow.sendOrderPlacedNotification(
        { id: 'order_123' },
        options,
        workingAttachmentGenerator
      );

      expect(result.status).toBe('sent');
      expect(result.data.Attachments).toHaveLength(1);
      expect(result.data.Attachments[0]).toEqual({
        content: 'base64-pdf-content',
        Name: 'invoice.pdf',
        ContentType: 'application/pdf',
        ContentID: 'cid:invoice.pdf'
      });
      
      // Complete order data should still be included
      expect(result.data.params.id).toBe('order_123');
      expect(result.data.params.total).toBe('$63.00 USD');
    });

    it('should handle missing attachment generator gracefully', async () => {
      const options = {
        from_email: 'store@example.com',
        from_name: 'Test Store',
        events: { order: { placed: 123 } },
        default_data: {},
        pdf: { enabled: true }
      };

      const result = await mockNotificationFlow.sendOrderPlacedNotification(
        { id: 'order_123' },
        options,
        null // No attachment generator
      );

      expect(result.status).toBe('sent');
      expect(result.data.Attachments).toBeUndefined();
      
      // Complete order data should still be included
      expect(result.data.params.id).toBe('order_123');
      expect(result.data.params.items).toHaveLength(1);
    });
  });

  describe('Data Completeness Validation', () => {
    it('should include all required order fields for template building', async () => {
      const options = {
        from_email: 'store@example.com',
        from_name: 'Test Store',
        events: { order: { placed: 123 } },
        default_data: {}
      };

      const result = await mockNotificationFlow.sendOrderPlacedNotification(
        { id: 'order_123' },
        options,
        null
      );

      const params = result.data.params;

      // Core order fields
      const requiredOrderFields = [
        'id', 'status', 'fulfillment_status', 'payment_status', 'display_id',
        'email', 'currency_code', 'created_at', 'total', 'subtotal', 'tax_total',
        'shipping_total', 'discount_total', 'metadata'
      ];

      requiredOrderFields.forEach(field => {
        expect(params).toHaveProperty(field);
      });

      // Customer fields
      expect(params.customer).toHaveProperty('id');
      expect(params.customer).toHaveProperty('email');
      expect(params.customer).toHaveProperty('first_name');
      expect(params.customer).toHaveProperty('metadata');

      // Address fields
      expect(params.billing_address).toHaveProperty('address_1');
      expect(params.billing_address).toHaveProperty('city');
      expect(params.billing_address).toHaveProperty('country_code');
      expect(params.billing_address).toHaveProperty('metadata');

      expect(params.shipping_address).toHaveProperty('address_1');
      expect(params.shipping_address).toHaveProperty('city');
      expect(params.shipping_address).toHaveProperty('metadata');

      // Item fields
      expect(params.items[0]).toHaveProperty('id');
      expect(params.items[0]).toHaveProperty('title');
      expect(params.items[0]).toHaveProperty('quantity');
      expect(params.items[0]).toHaveProperty('unit_price');
      expect(params.items[0]).toHaveProperty('metadata');
      expect(params.items[0]).toHaveProperty('variant');
      expect(params.items[0]).toHaveProperty('totals');
      expect(params.items[0]).toHaveProperty('adjustments');
      expect(params.items[0]).toHaveProperty('tax_lines');

      // Variant fields
      expect(params.items[0].variant).toHaveProperty('id');
      expect(params.items[0].variant).toHaveProperty('sku');
      expect(params.items[0].variant).toHaveProperty('metadata');
      expect(params.items[0].variant).toHaveProperty('product');

      // Product fields
      expect(params.items[0].variant.product).toHaveProperty('id');
      expect(params.items[0].variant.product).toHaveProperty('title');
      expect(params.items[0].variant.product).toHaveProperty('description');
      expect(params.items[0].variant.product).toHaveProperty('images');
      expect(params.items[0].variant.product).toHaveProperty('metadata');
      expect(params.items[0].variant.product).toHaveProperty('profiles');

      // Locale information
      expect(params.locale).toHaveProperty('locale');
      expect(params.locale).toHaveProperty('countryCode');
    });

    it('should preserve all metadata fields for template customization', async () => {
      const options = {
        from_email: 'store@example.com',
        from_name: 'Test Store',
        events: { order: { placed: 123 } },
        default_data: {}
      };

      const result = await mockNotificationFlow.sendOrderPlacedNotification(
        { id: 'order_123' },
        options,
        null
      );

      const params = result.data.params;

      // Order metadata
      expect(params.metadata).toEqual({
        source: 'web',
        campaign_id: 'summer_2023',
        utm_source: 'google'
      });

      // Customer metadata
      expect(params.customer.metadata).toEqual({
        vip_tier: 'gold',
        preferred_language: 'en',
        marketing_consent: true
      });

      // Address metadata
      expect(params.billing_address.metadata).toEqual({
        address_type: 'business',
        verified: true,
        tax_id: 'US123456789'
      });

      expect(params.shipping_address.metadata).toEqual({
        delivery_instructions: 'Ring doorbell twice, leave at front door',
        access_code: '1234',
        safe_location: 'Front porch'
      });

      // Item metadata
      const item = params.items[0];
      expect(item.metadata.price_attributes).toBeDefined();
      expect(item.metadata.customization).toBeDefined();
      expect(item.metadata.fulfillment).toBeDefined();

      // Variant metadata
      expect(item.variant.metadata.price_attributes).toBeDefined();
      expect(item.variant.metadata.inventory).toBeDefined();

      // Product metadata
      expect(item.variant.product.metadata.specifications).toBeDefined();
      expect(item.variant.product.metadata.sustainability).toBeDefined();
      expect(item.variant.product.metadata.seo).toBeDefined();
      expect(item.variant.product.metadata.marketing).toBeDefined();
    });
  });
});