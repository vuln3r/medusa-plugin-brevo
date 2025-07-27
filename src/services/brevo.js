import { humanizeAmount, zeroDecimalCurrencies } from "medusa-core-utils";
import { DateTime } from "luxon";
import { NotificationService } from "medusa-interfaces";
import { EntityManager, IsNull, Not, LessThan } from "typeorm";
import * as Brevo from "@getbrevo/brevo";  // Import Brevo SDK

class BrevoService extends NotificationService {
  static identifier = "brevo";
  manager_ = null;
  orderRepository_ = null;
  cartRepository_ = null;
  lineItemRepository_ = null;

  /**
   * @param {Object} options - options defined in `medusa-config.js`
   */
  constructor(
    {
      manager,
      orderRepository,
      cartRepository,
      lineItemRepository,
      orderService,
      cartService,
      fulfillmentService,
      totalsService,
      giftCardService,
    },
    options
  ) {
    super({ manager, orderRepository, cartRepository, lineItemRepository });

    this.options_ = options;

    this.manager_ = manager;
    this.orderRepository_ = orderRepository;
    this.cartRepository_ = cartRepository;
    this.lineItemRepository_ = lineItemRepository;
    this.orderService_ = orderService;
    this.cartService_ = cartService;
    this.fulfillmentService_ = fulfillmentService;
    this.totalsService_ = totalsService;
    this.giftCardService_ = giftCardService;

    // Initialize Brevo client
    this.client_ = new Brevo.TransactionalEmailsApi();
    this.client_.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, options.api_key);
    this.contactsClient_ = new Brevo.ContactsApi();
    this.contactsClient_.setApiKey(Brevo.ContactsApiApiKeys.apiKey, options.api_key);

  }

  async addCustomerToContactList(customer) {
    if (!this.options_?.contact_list || !this.options_?.contact_list?.enabled || !this.options_?.contact_list?.contact_list_id) {
      return;
    }
    const contactData = {
      email: customer.email,
      attributes: {
        FNAME: customer.first_name,
        LNAME: customer.last_name,
      },
      listIds: [this.options_.contact_list.contact_list_id],  // Ensure this is an array
    };

    try {

      const response = await this.contactsClient_.createContact(contactData);
      return response;
    } catch (error) {
      console.error("Error adding customer to Brevo contact list:", error);
      throw error;
    }
  }

  async sendEmail(sendOptions) {
    const emailData = {
      sender: { 
        email: this.options_.from_email,
        name: this.options_.from_name // Assuming this is set in your options
      },
      to: sendOptions.to,
      templateId: Number(sendOptions.templateId),
      params: sendOptions.params,
    };
  
    try {
      const response = await this.client_.sendTransacEmail(emailData);
      return response;
    } catch (error) {
      console.error("Error sending email with Brevo:", error);
      throw error;
    }
  }
  
  
  


  async getAbandonedCarts() {
    if (!this.options_?.abandoned_cart || !this.options_?.abandoned_cart?.enabled || !this.options_?.abandoned_cart?.first) {
      return;
    }
  
    console.log("Getting abandoned carts");
    const options = this.options_?.abandoned_cart;
    const now = new Date();
    const firstCheck = new Date(now.getTime() - parseInt(options?.first?.delay) * 60 * 60 * 1000);
    const secondCheck = new Date(now.getTime() - parseInt(options?.second?.delay) * 60 * 60 * 1000);
    const thirdCheck = new Date(now.getTime() - parseInt(options?.third?.delay) * 60 * 60 * 1000);
    const cartRepository = this.manager_.withRepository(this.cartRepository_);
    const carts = await cartRepository.findBy({
      email: Not(IsNull()),
    });
  
    console.log("Checking carts");
    let abandonedCarts = [];
    for (const cart of carts) {
      let orderCheck = false;
      try {
        orderCheck = await this.orderService_.retrieveByCartId(cart.id);
      } catch (e) {
        orderCheck = false;
      }
      const cartData = await this.cartService_.retrieve(cart.id, { relations: ["items", "shipping_address", "region"] });
      if (orderCheck) continue;
      if (cartData.items.find((li) => li?.updated_at <= firstCheck) !== undefined && cart?.metadata?.third_abandonedcart_mail !== true) {
        abandonedCarts.push(cartData);
      }
    }
    
    if (abandonedCarts.length === 0) return;
  
    for (const cart of abandonedCarts) {
      const check = cart.items.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())[0].updated_at;
      const items = this.processItems_(cart.items, cart?.region?.includes_tax ? 0 : (cart?.region?.tax_rate / 100), cart?.region?.currency_code.toUpperCase());
  
      // Extract locale and countryCode using your extractLocale function
      const { locale, countryCode } = await this.extractLocale(cart); 
  
      let templateId;
      const action = check < thirdCheck ? "third" : check < secondCheck ? "second" : "first";  // Determine which abandoned cart email to send
      templateId = options[action]?.template;
  
      // Check if templateId is an object (with locale or countryCode mappings) or a single ID
      if (typeof templateId === "object") {
        if (countryCode && templateId[countryCode]) {
          templateId = templateId[countryCode];
        } else if (locale && templateId[locale]) {
          templateId = templateId[locale];
        } else {
          templateId = templateId.default || Object.values(templateId)[0];  // Fallback to the default or first template
        }
      }
  
      const sendOptions = {
        sender: { email: this.options_.from_email, name: this.options_.from_name },
        to: [{ email: cart.email }],
        templateId: Number(templateId),  // Ensure the template ID is a number
        params: { ...cart, items, ...this.options_.default_data }
      };
  
      // Check which reminder stage to send
      if (check < secondCheck) {
        if (check < thirdCheck && !cart?.metadata?.third_abandonedcart_mail) {
          await this.sendEmail(sendOptions)
            .then(async () => {
              await cartRepository.update(cart.id, {
                metadata: { ...cart.metadata, third_abandonedcart_mail: true }
              });
            })
            .catch((error) => console.error(error));
        }
      } else if (check < secondCheck && !cart?.metadata?.second_abandonedcart_mail) {
        await this.sendEmail(sendOptions)
          .then(async () => {
            await cartRepository.update(cart.id, {
              metadata: { ...cart.metadata, second_abandonedcart_mail: true }
            });
          })
          .catch((error) => console.error(error));
      } else if (!cart?.metadata?.first_abandonedcart_mail) {
        await this.sendEmail(sendOptions)
          .then(async () => {
            await cartRepository.update(cart.id, {
              metadata: { ...cart.metadata, first_abandonedcart_mail: true }
            });
          })
          .catch((error) => console.error(error));
      }
    }
  }

  async remindUpsellOrders() {
    if (!this.options_?.upsell || !this.options_?.upsell?.enabled || !this.options_?.upsell?.collection || !this.options_?.upsell?.delay || !this.options_?.upsell?.template) {
      return [];
    }
    const orderRepo = this.manager_.withRepository(this.orderRepository_);
    const options = this.options_.upsell;
    const validThrough = DateTime.now().minus({ days: options.valid }).toLocaleString(DateTime.DATE_FULL);
    const orders = await orderRepo.findBy({
      created_at: LessThan(new Date(new Date().getTime() - parseInt(options.delay) * 60 * 60 * 24 * 1000)),
    });

    for (const order of orders) {
      if (order.metadata?.upsell_sent || order.created_at < new Date(new Date().getTime() - parseInt(options.delay) * 60 * 60 * 24 * 1000)) continue;
      const orderData = await this.orderService_.retrieve(order.id, {
        select: ["id"],
        relations: [
          "customer", "items", "items.variant", "items.variant.product"
        ],
      });
      let upsell = true;
      for (const item of orderData.items) {
        if (item?.variant?.product?.collection_id !== options.collection)
          upsell = false;
      }
      if (upsell) {
        if (options.template.includes(",")) {
          options.template = options.template.split(",");
          options.template = options.template[Math.floor(Math.random() * options.template.length)];
        }
        const sendOptions = {
          sender: { 
            email: this.options_.from_email,
            name: this.options_.from_name
           },  // Corrected: Wrap 'From' in 'sender' object
          to: [{ email: orderData.customer.email }],  // Corrected: 'to' should be an array of objects
          templateId: options.template,  // Ensure this is the correct template ID
          params: {
            ...orderData,
            ...this.options_.default_data,
            valid_through: validThrough
          }
        };
        

        // Update order metadata
        order.metadata = {
          ...order.metadata,
          upsell_sent: true
        };
        await this.sendEmail(sendOptions)
          .then(async () => {
            await this.orderService_.update(order.id, { metadata: order.metadata });
          })
          .catch((error) => {
            console.error(error);
            return { to: sendOptions.to, status: 'failed', data: sendOptions };
          });
      }
    }
  }

  async fetchAttachments(event, data, attachmentGenerator) {
    let attachments = [];
    switch (event) {
      case "user.password_reset": {
        try {
          if (attachmentGenerator && attachmentGenerator.createPasswordReset) {
            const base64 = await attachmentGenerator.createPasswordReset();
            attachments.push({
              name: "password-reset.pdf",
              base64,
              type: "application/pdf",
            });
          }
        } catch (err) {
          console.error("PDF generation failed for user.password_reset:", err);
          // Continue without PDF attachment - don't block notification
        }
        return attachments;
      }
      case "swap.created":
      case "order.return_requested": {
        try {
          const { shipping_method, shipping_data } = data.return_request;
          if (shipping_method) {
            const provider = shipping_method.shipping_option.provider_id;

            const lbl = await this.fulfillmentProviderService_.retrieveDocuments(
              provider,
              shipping_data,
              "label"
            );

            attachments = attachments.concat(
              lbl.map((d) => ({
                name: "return-label.pdf",
                base64: d.base_64,
                type: d.type,
              }))
            );
          }
        } catch (err) {
          console.error("Return label generation failed:", err);
          // Continue without return label - don't block notification
        }

        try {
          if (attachmentGenerator && attachmentGenerator.createReturnInvoice) {
            const base64 = await attachmentGenerator.createReturnInvoice(
              data.order,
              data.return_request.items
            );
            attachments.push({
              name: "invoice.pdf",
              base64,
              type: "application/pdf",
            });
          }
        } catch (err) {
          console.error("Return invoice PDF generation failed:", err);
          // Continue without PDF attachment - don't block notification
        }
        return attachments;
      }
      case "order.placed": {
        // Add configuration checks for PDF enablement before attempting PDF generation
        const pdfEnabled = this.options_?.pdf?.enabled ?? false;
        
        if (!pdfEnabled) {
          console.log("PDF generation is disabled in configuration");
          return attachments; // Return empty attachments array
        }

        if (!attachmentGenerator) {
          console.log("No attachment generator provided - skipping PDF generation");
          return attachments;
        }

        if (!attachmentGenerator.createInvoice) {
          console.log("Attachment generator does not support invoice creation - skipping PDF generation");
          return attachments;
        }

        try {
          console.log("Attempting PDF generation for order.placed");
          const base64 = await attachmentGenerator.createInvoice(
            this.options_,
            data
          );
          attachments.push({
            name: "invoice.pdf",
            base64,
            type: "application/pdf",
          });
          console.log("PDF generation successful for order.placed");
        } catch (err) {
          // Ensure PDF generation errors don't affect the main order data transmission
          console.error("PDF generation failed for order.placed - continuing with order notification:", err);
          // Log the specific error details for debugging
          if (err.message) {
            console.error("PDF generation error message:", err.message);
          }
          if (err.stack) {
            console.error("PDF generation error stack:", err.stack);
          }
          // Continue without PDF attachment - don't block the main order notification
        }
        return attachments;
      }
      default:
        return [];
    }
  }

  async fetchData(event, eventData, attachmentGenerator) {
    switch (event) {
      case "order.placed":
        return this.orderPlacedData(eventData, attachmentGenerator);
      case "order.shipment_created":
        //console.log('orderShipmentCreatedData log:',this.orderShipmentCreatedData(eventData, attachmentGenerator))
        return this.orderShipmentCreatedData(eventData, attachmentGenerator);
      case "order.canceled":
        return this.orderCanceledData(eventData, attachmentGenerator);
      case "user.password_reset":
        return this.userPasswordResetData(eventData, attachmentGenerator);
      case "customer.password_reset":
        return this.customerPasswordResetData(eventData, attachmentGenerator);
      case "gift_card.created":
        return this.giftCardData(eventData, attachmentGenerator);
      default:
        return eventData;
    }
  }

  async sendNotification(event, eventData, attachmentGenerator) {
    let group = undefined;
    let action = undefined;
    try {
      const event_ = event.split(".", 2);
      group = event_[0];
      action = event_[1];
      if (typeof group === "undefined" || typeof action === "undefined" || this.options_.events[group] === undefined || this.options_.events[group][action] === undefined)
        return false;
    } catch (err) {
      console.error("Error parsing event or checking configuration:", err);
      return false;
    }

    // Fetch order data first - this is the primary function
    const data = await this.fetchData(event, eventData, attachmentGenerator);
    
    // Fetch attachments independently - failures here should not affect data transmission
    let attachments = [];
    try {
      attachments = await this.fetchAttachments(
        event,
        data,
        attachmentGenerator
      );
      console.log(`Attachment processing completed for ${event}. Attachments count: ${attachments?.length || 0}`);
    } catch (err) {
      // Log attachment failures but continue with notification
      console.error(`Attachment generation failed for ${event} - continuing with notification:`, err);
      attachments = []; // Ensure attachments is always an array
    }

    let templateId = this.options_.events[group][action];

    if (typeof templateId === "object") {
      // Prioritize countryCode over locale
      if (data.locale?.countryCode && templateId[data.locale.countryCode]) {
        templateId = templateId[data.locale.countryCode];
      } else if (data.locale?.locale && templateId[data.locale.locale]) {
        templateId = templateId[data.locale.locale];
      } else {
        templateId = Object.values(templateId)[0]; // Fallback to the first template if no match
      }
    }
       
  
    if (templateId === null)
      return false;

    const sendOptions = {
      sender: { 
        email: this.options_.from_email,
        name: this.options_.from_name
       },  // Correct structure for sender
      to: [{ email: data.email ?? data?.customer?.email }],  // Correct structure for recipient
      templateId: Number(templateId),
      params: {
        ...data,
        ...this.options_.default_data
      }
    };
    
    if (this.options_?.bcc)
      sendOptions.Bcc = this.options_.bcc;

    // Only add attachments if they exist and are valid
    if (attachments && attachments.length > 0) {
      try {
        sendOptions.Attachments = attachments.map((a) => {
          return {
            content: a.base64,
            Name: a.name,
            ContentType: a.type,
            ContentID: `cid:${a.name}`,
          };
        });
        console.log(`Added ${attachments.length} attachment(s) to ${event} notification`);
      } catch (err) {
        console.error(`Error processing attachments for ${event} - sending without attachments:`, err);
        // Remove attachments from sendOptions if processing fails
        delete sendOptions.Attachments;
      }
    } else {
      console.log(`No attachments to include for ${event} notification`);
    }

    return await this.client_.sendTransacEmail(sendOptions)
      .then(() => {
        console.log(`Successfully sent ${event} notification`);
        return { to: sendOptions.to, status: 'sent', data: sendOptions };
      })
      .catch((error) => {
        console.error(`Failed to send ${event} notification:`, error);
        return { to: sendOptions.to, status: 'failed', data: sendOptions };
      });
  }

  async resendNotification(notification, config, attachmentGenerator) {
    const sendOptions = {
      ...notification.data,
      To: config.to || notification.to,
    };

    const attachs = await this.fetchAttachments(
      notification.event_name,
      notification.data.dynamic_template_data,
      attachmentGenerator
    );
    sendOptions.attachments = attachs.map((a) => {
      return {
        content: a.base64,
        filename: a.name,
        type: a.type,
        disposition: "attachment",
        contentId: a.name,
      };
    });

    return await this.client_.sendTransacEmail(sendOptions)
      .then(() => ({ to: sendOptions.To, status: 'sent', data: sendOptions }))
      .catch((error) => {
        console.error(error);
        return { to: sendOptions.To, status: 'failed', data: sendOptions };
      });
  }

  async sendMail(options) {
    try {
      this.client_.sendTransacEmail({
        ...options,
        params: {
          ...options.TemplateModel,
          ...this.options_.default_data
        }
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async orderShipmentCreatedData({ id, fulfillment_id }, attachmentGenerator) {
    // Fetch the full order details using the order ID
    const order = await this.orderService_.retrieve(id, {
      select: [
        "id",
        "email",
        "shipping_total",
        "discount_total",
        "tax_total",
        "refunded_total",
        "gift_card_total",
        "subtotal",
        "total",
        "refundable_amount",
        "created_at",
        "updated_at",
        "customer_id",
        "currency_code",
        "tax_rate",
        "cart_id"
      ],
      relations: [
        "customer",
        "billing_address",
        "shipping_address",
        "discounts",
        "discounts.rule",
        "shipping_methods",
        "shipping_methods.shipping_option",
        "payments",
        "fulfillments",
        "returns",
        "gift_cards",
        "gift_card_transactions",
        "region",
        "items",
        "items.variant",
        "items.variant.product"
      ],
    });
  
    // Fetch the shipment details using the fulfillment ID
    const shipment = await this.fulfillmentService_.retrieve(fulfillment_id, {
      relations: ["items", "tracking_links"],
    });

    const tracking_numbers = shipment.tracking_links.map(link => link.tracking_number).join(", ");
    
    const locale = await this.extractLocale(order)

   
    //console.log('Tracking Number:', tracking_numbers);
   
  
    return {
      locale,
      order,
      date: shipment.shipped_at.toLocaleString(),
      email: order.email,
      fulfillment: shipment,
      tracking_links: shipment.tracking_links,
      tracking_number: tracking_numbers,
      
    };
  }
  

  async orderCanceledData({ id }) {
    const order = await this.orderService_.retrieve(id, {
      select: [
        "shipping_total",
        "discount_total",
        "tax_total",
        "refunded_total",
        "gift_card_total",
        "subtotal",
        "total",
      ],
      relations: [
        "customer",
        "billing_address",
        "shipping_address",
        "discounts",
        "discounts.rule",
        "shipping_methods",
        "shipping_methods.shipping_option",
        "payments",
        "fulfillments",
        "returns",
        "gift_cards",
        "gift_card_transactions",
      ],
    });

    const {
      subtotal,
      tax_total,
      discount_total,
      shipping_total,
      gift_card_total,
      total,
    } = order;

    const taxRate = order.tax_rate / 100;
    const currencyCode = order.currency_code.toUpperCase();

    const items = this.processItems_(order.items, taxRate, currencyCode);

    let discounts = [];
    if (order.discounts) {
      discounts = order.discounts.map((discount) => {
        return {
          is_giftcard: false,
          code: discount.code,
          descriptor: `${discount.rule.value}${
            discount.rule.type === "percentage" ? "%" : ` ${currencyCode}`
          }`,
        };
      });
    }

    let giftCards = [];
    if (order.gift_cards) {
      giftCards = order.gift_cards.map((gc) => {
        return {
          is_giftcard: true,
          code: gc.code,
          descriptor: `${gc.value} ${currencyCode}`,
        };
      });

      discounts.concat(giftCards);
    }

    const locale = await this.extractLocale(order);

    return {
      ...order,
      locale,
      has_discounts: order.discounts.length,
      has_gift_cards: order.gift_cards.length,
      date: order.created_at.toLocaleString(),
      items,
      discounts,
      subtotal: `${this.humanPrice_(
        subtotal * (1 + taxRate),
        currencyCode
      )} ${currencyCode}`,
      gift_card_total: `${this.humanPrice_(
        gift_card_total * (1 + taxRate),
        currencyCode
      )} ${currencyCode}`,
      tax_total: `${this.humanPrice_(tax_total, currencyCode)} ${currencyCode}`,
      discount_total: `${this.humanPrice_(
        discount_total * (1 + taxRate),
        currencyCode
      )} ${currencyCode}`,
      shipping_total: `${this.humanPrice_(
        shipping_total * (1 + taxRate),
        currencyCode
      )} ${currencyCode}`,
      total: `${this.humanPrice_(total, currencyCode)} ${currencyCode}`,
    };
  }

  async giftCardData({ id }) {
    let data = await this.giftCardService.retrieve(
      id, { relations: ["order"] }
    );
    return {
      ...data,
      email: data.order.email ?? ''
    };
  }
  async orderPlacedData({ id }) {
    let order;
    
    // Implement try-catch blocks around enhanced data retrieval with fallback to minimal data
    try {
      console.log(`Attempting to retrieve enhanced order data for order ${id}`);
      order = await this.orderService_.retrieve(id, {
        // Include all order fields instead of limited set
        select: [
          "id",
          "status",
          "fulfillment_status", 
          "payment_status",
          "display_id",
          "cart_id",
          "customer_id",
          "email",
          "billing_address_id",
          "shipping_address_id",
          "region_id",
          "currency_code",
          "tax_rate",
          "canceled_at",
          "metadata",
          "no_notification",
          "idempotency_key",
          "draft_order_id",
          "created_at",
          "updated_at",
          "shipping_total",
          "discount_total",
          "tax_total",
          "refunded_total",
          "gift_card_total",
          "subtotal",
          "total",
          "paid_total",
          "refundable_amount",
          "external_id",
          "sales_channel_id"
        ],
        // Add comprehensive relations including items.variant.product and all nested relationships
        relations: [
          "customer",
          "billing_address",
          "shipping_address",
          "discounts",
          "discounts.rule",
          "shipping_methods",
          "shipping_methods.shipping_option",
          "payments",
          "fulfillments",
          "returns",
          "gift_cards",
          "gift_card_transactions",
          "items",
          "items.variant",
          "items.variant.product",
          "items.variant.product.profiles",
          "items.adjustments",
          "items.tax_lines",
          "region",
          "sales_channel",
          "claims",
          "swaps"
        ],
      });
      console.log(`Successfully retrieved enhanced order data for order ${id}`);
    } catch (enhancedRetrievalError) {
      // Add logging for data retrieval failures without blocking notification sending
      console.error(`Enhanced order data retrieval failed for order ${id}, falling back to minimal data:`, enhancedRetrievalError);
      
      try {
        // Fallback to minimal data approach (similar to original implementation)
        console.log(`Attempting fallback to minimal order data for order ${id}`);
        order = await this.orderService_.retrieve(id, {
          select: [
            "shipping_total",
            "discount_total", 
            "tax_total",
            "refunded_total",
            "gift_card_total",
            "subtotal",
            "total",
            "currency_code",
            "tax_rate",
            "created_at",
            "email",
            "id",
            "display_id"
          ],
          relations: [
            "customer",
            "billing_address",
            "shipping_address",
            "discounts",
            "discounts.rule",
            "shipping_methods",
            "shipping_methods.shipping_option",
            "payments",
            "fulfillments",
            "returns",
            "gift_cards",
            "gift_card_transactions",
          ],
        });
        console.log(`Successfully retrieved minimal order data for order ${id}`);
      } catch (minimalRetrievalError) {
        console.error(`Both enhanced and minimal order data retrieval failed for order ${id}:`, minimalRetrievalError);
        throw new Error(`Unable to retrieve order data for order ${id}: ${minimalRetrievalError.message}`);
      }
    }

    const { tax_total, shipping_total, gift_card_total, total } = order;

    const currencyCode = order.currency_code.toUpperCase();

    let items = [];
    
    // Create graceful handling for missing relations or metadata fields
    try {
      console.log(`Processing ${order.items?.length || 0} items for order ${id}`);
      
      // Check if items exist and have the expected structure
      if (!order.items || !Array.isArray(order.items)) {
        console.warn(`Order ${id} has no items or items is not an array, using empty items array`);
        items = [];
      } else {
        items = await Promise.all(
          order.items.map(async (originalItem, index) => {
            try {
              // Calculate totals for the item with error handling
              let totals;
              try {
                totals = await this.totalsService_.getLineItemTotals(originalItem, order, {
                  include_tax: true,
                  use_tax_lines: true,
                });
              } catch (totalsError) {
                console.error(`Failed to calculate totals for item ${index} in order ${id}:`, totalsError);
                // Fallback to basic totals calculation
                totals = {
                  total: originalItem.unit_price * originalItem.quantity,
                  original_total: originalItem.unit_price * originalItem.quantity,
                  subtotal: originalItem.unit_price * originalItem.quantity,
                  tax_total: 0,
                  discount_total: 0
                };
              }

              // Preserve all original item fields and metadata while adding calculated values
              const processedItem = {
                ...originalItem, // All original item fields including metadata, adjustments, tax_lines
                
                // Create graceful handling for missing relations or metadata fields
                // Preserve complete variant data including metadata and price_attributes
                variant: originalItem.variant ? {
                  ...originalItem.variant,
                  metadata: originalItem.variant?.metadata || {},
                  // Preserve any price_attributes from variant metadata
                  price_attributes: originalItem.variant?.metadata?.price_attributes || null,
                  
                  // Include complete product information with descriptions, images, and metadata
                  product: originalItem.variant?.product ? {
                    ...originalItem.variant.product,
                    metadata: originalItem.variant.product?.metadata || {},
                    // Preserve product descriptions, images, and all attributes
                    description: originalItem.variant.product?.description || null,
                    images: originalItem.variant.product?.images || [],
                    thumbnail: originalItem.variant.product?.thumbnail || null,
                    profiles: originalItem.variant.product?.profiles || []
                  } : null
                } : null,

                // Add calculated totals while preserving original data
                totals,
                
                // Add formatted prices while preserving original pricing data
                discounted_price: `${this.humanPrice_(
                  totals.total / (originalItem.quantity || 1),
                  currencyCode
                )} ${currencyCode}`,
                price: `${this.humanPrice_(
                  totals.original_total / (originalItem.quantity || 1),
                  currencyCode
                )} ${currencyCode}`,
                
                // Normalize thumbnail URL while preserving original
                thumbnail: this.normalizeThumbUrl_(originalItem.thumbnail),
                
                // Ensure metadata and price_attributes are accessible at item level for template convenience
                // (Note: these are already preserved in ...originalItem but made explicit for clarity)
                metadata: originalItem.metadata || {},
                price_attributes: originalItem.metadata?.price_attributes || null
              };

              return processedItem;
            } catch (itemProcessingError) {
              console.error(`Failed to process item ${index} in order ${id}:`, itemProcessingError);
              // Return a minimal item structure to prevent complete failure
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
                discounted_price: `${this.humanPrice_(originalItem.unit_price, currencyCode)} ${currencyCode}`,
                price: `${this.humanPrice_(originalItem.unit_price, currencyCode)} ${currencyCode}`,
                thumbnail: this.normalizeThumbUrl_(originalItem.thumbnail),
                metadata: originalItem.metadata || {},
                price_attributes: null
              };
            }
          })
        );
      }
      console.log(`Successfully processed ${items.length} items for order ${id}`);
    } catch (itemsProcessingError) {
      console.error(`Failed to process items for order ${id}:`, itemsProcessingError);
      // Fallback to basic item processing if enhanced processing fails
      try {
        items = this.processItems_(order.items || [], order.tax_rate / 100, currencyCode);
        console.log(`Fallback item processing successful for order ${id}`);
      } catch (fallbackError) {
        console.error(`Fallback item processing also failed for order ${id}:`, fallbackError);
        items = []; // Use empty array as final fallback
      }
    }

    // Create graceful handling for missing relations or metadata fields
    let discounts = [];
    try {
      if (order.discounts && Array.isArray(order.discounts)) {
        discounts = order.discounts.map((discount, index) => {
          try {
            return {
              is_giftcard: false,
              code: discount.code || `discount_${index}`,
              descriptor: `${discount.rule?.value || 0}${
                discount.rule?.type === "percentage" ? "%" : ` ${currencyCode}`
              }`,
            };
          } catch (discountError) {
            console.error(`Failed to process discount ${index} for order ${id}:`, discountError);
            return {
              is_giftcard: false,
              code: `discount_${index}`,
              descriptor: `0 ${currencyCode}`,
            };
          }
        });
      }
    } catch (discountsError) {
      console.error(`Failed to process discounts for order ${id}:`, discountsError);
      discounts = [];
    }

    let giftCards = [];
    try {
      if (order.gift_cards && Array.isArray(order.gift_cards)) {
        giftCards = order.gift_cards.map((gc, index) => {
          try {
            return {
              is_giftcard: true,
              code: gc.code || `giftcard_${index}`,
              descriptor: `${gc.value || 0} ${currencyCode}`,
            };
          } catch (giftCardError) {
            console.error(`Failed to process gift card ${index} for order ${id}:`, giftCardError);
            return {
              is_giftcard: true,
              code: `giftcard_${index}`,
              descriptor: `0 ${currencyCode}`,
            };
          }
        });

        discounts.concat(giftCards);
      }
    } catch (giftCardsError) {
      console.error(`Failed to process gift cards for order ${id}:`, giftCardsError);
      giftCards = [];
    }

    // Extract locale information and include comprehensive regional formatting data
    let locale;
    let regionInfo = {};
    try {
      locale = await this.extractLocale(order);
      console.log(`Successfully extracted locale for order ${id}:`, locale);
      
      // Include comprehensive regional and currency information
      regionInfo = {
        currency_code: currencyCode,
        region: order.region ? {
          ...order.region,
          currency_code: order.region.currency_code,
          tax_rate: order.region.tax_rate,
          includes_tax: order.region.includes_tax,
          metadata: order.region.metadata || {}
        } : null,
        // Include locale-specific formatting information
        locale_info: {
          locale: locale?.locale || 'en',
          country_code: locale?.countryCode || 'US',
          currency_code: currencyCode,
          // Add regional formatting context
          date_format: this.getDateFormatForLocale(locale?.locale || 'en'),
          number_format: this.getNumberFormatForLocale(locale?.locale || 'en', currencyCode)
        }
      };
    } catch (localeError) {
      console.error(`Failed to extract locale for order ${id}:`, localeError);
      // Provide fallback locale information with regional data
      locale = { 
        locale: 'en', 
        countryCode: 'US' 
      };
      regionInfo = {
        currency_code: currencyCode,
        region: order.region || null,
        locale_info: {
          locale: 'en',
          country_code: 'US',
          currency_code: currencyCode,
          date_format: this.getDateFormatForLocale('en'),
          number_format: this.getNumberFormatForLocale('en', currencyCode)
        }
      };
    }

    // Create graceful handling for missing relations or metadata fields
    let discountTotal = 0;
    let discounted_subtotal = 0;
    let subtotal = 0;
    let subtotal_ex_tax = 0;
    
    try {
      // Includes taxes in discount amount
      discountTotal = items.reduce((acc, i) => {
        try {
          return acc + (i.totals?.original_total || 0) - (i.totals?.total || 0);
        } catch (itemTotalError) {
          console.error(`Failed to calculate discount total for item in order ${id}:`, itemTotalError);
          return acc;
        }
      }, 0);

      discounted_subtotal = items.reduce((acc, i) => {
        try {
          return acc + (i.totals?.total || 0);
        } catch (itemTotalError) {
          console.error(`Failed to calculate discounted subtotal for item in order ${id}:`, itemTotalError);
          return acc;
        }
      }, 0);
      
      subtotal = items.reduce((acc, i) => {
        try {
          return acc + (i.totals?.original_total || 0);
        } catch (itemTotalError) {
          console.error(`Failed to calculate subtotal for item in order ${id}:`, itemTotalError);
          return acc;
        }
      }, 0);

      subtotal_ex_tax = items.reduce((total, i) => {
        try {
          return total + (i.totals?.subtotal || 0);
        } catch (itemTotalError) {
          console.error(`Failed to calculate subtotal ex tax for item in order ${id}:`, itemTotalError);
          return total;
        }
      }, 0);
    } catch (totalsCalculationError) {
      console.error(`Failed to calculate order totals for order ${id}:`, totalsCalculationError);
      // Use order-level totals as fallback
      discountTotal = order.discount_total || 0;
      discounted_subtotal = order.subtotal || 0;
      subtotal = order.subtotal || 0;
      subtotal_ex_tax = order.subtotal || 0;
    }


    // Create graceful handling for missing relations or metadata fields
    try {
      console.log(`Constructing final order data object for order ${id}`);
      
      const orderData = {
        ...order,
        locale,
        // Include comprehensive regional and formatting information
        region_info: regionInfo,
        has_discounts: order.discounts?.length || 0,
        has_gift_cards: order.gift_cards?.length || 0,
        
        // Include both raw timestamps and formatted date strings
        date: order.created_at ? order.created_at.toLocaleString() : new Date().toLocaleString(),
        date_raw: order.created_at || new Date(),
        created_at_formatted: order.created_at ? 
          order.created_at.toLocaleString(locale?.locale || 'en', {
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          }) : new Date().toLocaleString(),
        updated_at_formatted: order.updated_at ?
          order.updated_at.toLocaleString(locale?.locale || 'en', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit', 
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          }) : null,
        
        items,
        discounts,
        
        // Ensure order.metadata is explicitly included in the returned data structure
        metadata: order.metadata || {},
        
        // Include complete customer object with all fields and metadata
        customer: order.customer ? {
          ...order.customer,
          metadata: order.customer.metadata || {}
        } : null,
        
        // Preserve billing_address complete object with metadata
        billing_address: order.billing_address ? {
          ...order.billing_address,
          metadata: order.billing_address.metadata || {}
        } : null,
        
        // Preserve shipping_address complete object with metadata  
        shipping_address: order.shipping_address ? {
          ...order.shipping_address,
          metadata: order.shipping_address.metadata || {}
        } : null,
        
        // Maintain both raw values and formatted strings for prices
        subtotal_ex_tax: `${this.humanPrice_(
          subtotal_ex_tax,
          currencyCode
        )} ${currencyCode}`,
        subtotal_ex_tax_raw: subtotal_ex_tax,
        subtotal: `${this.humanPrice_(subtotal, currencyCode)} ${currencyCode}`,
        subtotal_raw: subtotal,
        gift_card_total: `${this.humanPrice_(
          gift_card_total || 0,
          currencyCode
        )} ${currencyCode}`,
        gift_card_total_raw: gift_card_total || 0,
        tax_total: `${this.humanPrice_(tax_total || 0, currencyCode)} ${currencyCode}`,
        tax_total_raw: tax_total || 0,
        discount_total: `${this.humanPrice_(
          discountTotal,
          currencyCode
        )} ${currencyCode}`,
        discount_total_raw: discountTotal,
        shipping_total: `${this.humanPrice_(
          shipping_total || 0,
          currencyCode
        )} ${currencyCode}`,
        shipping_total_raw: shipping_total || 0,
        shipping_total_inc: `${this.humanPrice_(
          order?.shipping_methods?.[0]?.price || shipping_total || 0,
          currencyCode
        )} ${currencyCode}`,
        shipping_total_inc_raw: order?.shipping_methods?.[0]?.price || shipping_total || 0,
        total: `${this.humanPrice_(total || 0, currencyCode)} ${currencyCode}`,
        total_raw: total || 0,
        
        // Include currency codes and regional formatting information
        currency: {
          code: currencyCode,
          symbol: this.getCurrencySymbol(currencyCode, locale?.locale || 'en'),
          formatted_sample: this.humanPrice_(1000, currencyCode),
          locale_specific_format: new Intl.NumberFormat(locale?.locale || 'en', {
            style: 'currency',
            currency: currencyCode
          }).format(1000)
        }
      };
      
      console.log(`Successfully constructed order data for order ${id}`);
      return orderData;
    } catch (dataConstructionError) {
      console.error(`Failed to construct final order data for order ${id}:`, dataConstructionError);
      
      // Return minimal fallback data structure with enhanced locale and formatting
      return {
        id: order.id,
        email: order.email,
        display_id: order.display_id,
        currency_code: currencyCode,
        
        // Include both raw values and formatted strings for prices
        total: `${this.humanPrice_(total || 0, currencyCode)} ${currencyCode}`,
        total_raw: total || 0,
        subtotal: `${this.humanPrice_(subtotal || 0, currencyCode)} ${currencyCode}`,
        subtotal_raw: subtotal || 0,
        tax_total: `${this.humanPrice_(tax_total || 0, currencyCode)} ${currencyCode}`,
        tax_total_raw: tax_total || 0,
        shipping_total: `${this.humanPrice_(shipping_total || 0, currencyCode)} ${currencyCode}`,
        shipping_total_raw: shipping_total || 0,
        discount_total: `${this.humanPrice_(discountTotal || 0, currencyCode)} ${currencyCode}`,
        discount_total_raw: discountTotal || 0,
        gift_card_total: `${this.humanPrice_(gift_card_total || 0, currencyCode)} ${currencyCode}`,
        gift_card_total_raw: gift_card_total || 0,
        
        // Include both raw timestamps and formatted date strings
        date: order.created_at ? order.created_at.toLocaleString() : new Date().toLocaleString(),
        date_raw: order.created_at || new Date(),
        created_at_formatted: order.created_at ? 
          order.created_at.toLocaleString(locale?.locale || 'en') : new Date().toLocaleString(),
        
        items: items || [],
        discounts: discounts || [],
        has_discounts: 0,
        has_gift_cards: 0,
        locale: locale || { locale: 'en', countryCode: 'US' },
        
        // Include comprehensive regional and formatting information
        region_info: {
          currency_code: currencyCode,
          region: null,
          locale_info: {
            locale: 'en',
            country_code: 'US',
            currency_code: currencyCode,
            date_format: this.getDateFormatForLocale('en'),
            number_format: this.getNumberFormatForLocale('en', currencyCode)
          }
        },
        
        // Include currency codes and regional formatting information
        currency: {
          code: currencyCode,
          symbol: this.getCurrencySymbol(currencyCode, locale?.locale || 'en'),
          formatted_sample: this.humanPrice_(1000, currencyCode),
          locale_specific_format: new Intl.NumberFormat(locale?.locale || 'en', {
            style: 'currency',
            currency: currencyCode
          }).format(1000)
        },
        
        metadata: {},
        customer: null,
        billing_address: null,
        shipping_address: null
      };
    }
  }

  userPasswordResetData(data) {
    return data;
  }

  customerPasswordResetData(data) {
    return data;
  }

  processItems_(items, taxRate, currencyCode) {
    return items.map((i) => {
      return {
        ...i,
        thumbnail: this.normalizeThumbUrl_(i.thumbnail),
        price: `${currencyCode} ${this.humanPrice_(
          i.unit_price * (1 + taxRate),
          currencyCode
        )}`,
      };
    });
  }

  humanPrice_(amount, currencyCode) {
    if (!amount)
      return "0.00";
    const normalizedAmount = humanizeAmount(amount, currencyCode);

    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      // Remove decimals for all currencies
      minimumFractionDigits: 0,
     
    });

    return formatter.format(normalizedAmount);
  }

  normalizeThumbUrl_(url) {
    if (!url)
      return null;
    else if (url.startsWith("http"))
      return url;
    else if (url.startsWith("//"))
      return `https:${url}`;
    return url;
  }

  async OLDextractLocale(fromOrder) {
    if (fromOrder.cart_id) {
      try {
        const cart = await this.cartService_.retrieve(fromOrder.cart_id, {
          select: ["id", "context"],
        });
        //console.log("Cart retrieved:", cart); // Log the cart data
        if (cart.context && cart.context.locale)
          return cart.context.locale;
      } catch (err) {
        console.log(err);
        console.warn("Failed to gather context for order");
        return null;
      }
    }
    return null;
  }

  async extractLocale(fromOrder) {
    if (fromOrder.cart_id) {
      try {
        const cart = await this.cartService_.retrieve(fromOrder.cart_id, {
          select: ["id", "context"],
        });
  
        // Extract locale and countryCode from cart context
        const { locale, countryCode } = cart.context || {};
  
        if (locale || countryCode) {
          return { locale, countryCode };
        }
      } catch (err) {
        console.log(err);
        console.warn("Failed to gather context for order");
        return { locale: null, countryCode: null };
      }
    }
    return { locale: null, countryCode: null };
  }

  // Helper method to get date format information for a locale
  getDateFormatForLocale(locale) {
    try {
      const sampleDate = new Date('2024-01-15T10:30:00Z');
      const formatter = new Intl.DateTimeFormat(locale || 'en', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      
      return {
        locale: locale || 'en',
        sample_format: formatter.format(sampleDate),
        options: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }
      };
    } catch (error) {
      console.error(`Error getting date format for locale ${locale}:`, error);
      return {
        locale: 'en',
        sample_format: '01/15/2024, 10:30 AM GMT',
        options: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }
      };
    }
  }

  // Helper method to get number format information for a locale and currency
  getNumberFormatForLocale(locale, currencyCode) {
    try {
      const sampleAmount = 1234.56;
      const currencyFormatter = new Intl.NumberFormat(locale || 'en', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      const numberFormatter = new Intl.NumberFormat(locale || 'en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      return {
        locale: locale || 'en',
        currency_code: currencyCode,
        sample_currency_format: currencyFormatter.format(sampleAmount),
        sample_number_format: numberFormatter.format(sampleAmount),
        currency_options: {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        },
        number_options: {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      };
    } catch (error) {
      console.error(`Error getting number format for locale ${locale} and currency ${currencyCode}:`, error);
      return {
        locale: 'en',
        currency_code: currencyCode,
        sample_currency_format: `${currencyCode} 1,234.56`,
        sample_number_format: '1,234.56',
        currency_options: {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        },
        number_options: {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      };
    }
  }

  // Helper method to get currency symbol for a given currency code and locale
  getCurrencySymbol(currencyCode, locale) {
    try {
      const formatter = new Intl.NumberFormat(locale || 'en', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      
      // Format 0 to get just the currency symbol
      const formatted = formatter.format(0);
      // Extract symbol by removing the number
      const symbol = formatted.replace(/[\d\s,]/g, '');
      return symbol || currencyCode;
    } catch (error) {
      console.error(`Error getting currency symbol for ${currencyCode} in locale ${locale}:`, error);
      return currencyCode;
    }
  }
  
}

export default BrevoService;
