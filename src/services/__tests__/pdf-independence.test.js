import BrevoService from '../brevo.js';

describe('BrevoService PDF Independence', () => {
  let brevoService;
  let mockOrderService;
  let mockCartService;
  let mockTotalsService;
  let mockClient;

  beforeEach(() => {
    // Mock dependencies
    mockOrderService = {
      retrieve: jest.fn()
    };
    
    mockCartService = {
      retrieve: jest.fn()
    };
    
    mockTotalsService = {
      getLineItemTotals: jest.fn()
    };

    mockClient = {
      sendTransacEmail: jest.fn()
    };

    const mockOptions = {
      api_key: 'test-key',
      from_email: 'test@example.com',
      from_name: 'Test Sender',
      events: {
        order: {
          placed: 123
        }
      },
      pdf: {
        enabled: true
      }
    };

    brevoService = new BrevoService({
      manager: { withRepository: jest.fn() },
      orderRepository: {},
      cartRepository: {},
      lineItemRepository: {},
      orderService: mockOrderService,
      cartService: mockCartService,
      fulfillmentService: {},
      totalsService: mockTotalsService,
      giftCardService: {}
    }, mockOptions);

    // Mock the client
    brevoService.client_ = mockClient;
  });

  describe('fetchAttachments for order.placed', () => {
    const mockOrderData = {
      id: 'order_123',
      email: 'customer@example.com'
    };

    test('should return empty attachments when PDF is disabled', async () => {
      brevoService.options_.pdf.enabled = false;
      
      const attachments = await brevoService.fetchAttachments('order.placed', mockOrderData, {});
      
      expect(attachments).toEqual([]);
    });

    test('should return empty attachments when no attachment generator provided', async () => {
      const attachments = await brevoService.fetchAttachments('order.placed', mockOrderData, null);
      
      expect(attachments).toEqual([]);
    });

    test('should return empty attachments when attachment generator lacks createInvoice method', async () => {
      const mockGenerator = {}; // No createInvoice method
      
      const attachments = await brevoService.fetchAttachments('order.placed', mockOrderData, mockGenerator);
      
      expect(attachments).toEqual([]);
    });

    test('should handle PDF generation failure gracefully', async () => {
      const mockGenerator = {
        createInvoice: jest.fn().mockRejectedValue(new Error('PDF generation failed'))
      };
      
      const attachments = await brevoService.fetchAttachments('order.placed', mockOrderData, mockGenerator);
      
      expect(attachments).toEqual([]);
      expect(mockGenerator.createInvoice).toHaveBeenCalled();
    });

    test('should successfully generate PDF when everything is configured correctly', async () => {
      const mockBase64 = 'base64-pdf-content';
      const mockGenerator = {
        createInvoice: jest.fn().mockResolvedValue(mockBase64)
      };
      
      const attachments = await brevoService.fetchAttachments('order.placed', mockOrderData, mockGenerator);
      
      expect(attachments).toEqual([{
        name: "invoice.pdf",
        base64: mockBase64,
        type: "application/pdf"
      }]);
      expect(mockGenerator.createInvoice).toHaveBeenCalledWith(brevoService.options_, mockOrderData);
    });
  });

  describe('sendNotification with PDF independence', () => {
    const mockEventData = { id: 'order_123' };
    
    beforeEach(() => {
      // Mock fetchData to return order data
      brevoService.fetchData = jest.fn().mockResolvedValue({
        id: 'order_123',
        email: 'customer@example.com',
        total: 100
      });
      
      mockClient.sendTransacEmail.mockResolvedValue({ messageId: 'msg_123' });
    });

    test('should send notification successfully even when PDF generation fails', async () => {
      const mockGenerator = {
        createInvoice: jest.fn().mockRejectedValue(new Error('PDF generation failed'))
      };
      
      const result = await brevoService.sendNotification('order.placed', mockEventData, mockGenerator);
      
      expect(result.status).toBe('sent');
      expect(mockClient.sendTransacEmail).toHaveBeenCalled();
      
      // Verify the email was sent without attachments
      const sendOptions = mockClient.sendTransacEmail.mock.calls[0][0];
      expect(sendOptions.Attachments).toBeUndefined();
    });

    test('should send notification with PDF when generation succeeds', async () => {
      const mockBase64 = 'base64-pdf-content';
      const mockGenerator = {
        createInvoice: jest.fn().mockResolvedValue(mockBase64)
      };
      
      const result = await brevoService.sendNotification('order.placed', mockEventData, mockGenerator);
      
      expect(result.status).toBe('sent');
      expect(mockClient.sendTransacEmail).toHaveBeenCalled();
      
      // Verify the email was sent with attachments
      const sendOptions = mockClient.sendTransacEmail.mock.calls[0][0];
      expect(sendOptions.Attachments).toHaveLength(1);
      expect(sendOptions.Attachments[0].Name).toBe('invoice.pdf');
    });

    test('should handle fetchAttachments throwing an error', async () => {
      // Mock fetchAttachments to throw an error
      brevoService.fetchAttachments = jest.fn().mockRejectedValue(new Error('Attachment processing failed'));
      
      const result = await brevoService.sendNotification('order.placed', mockEventData, {});
      
      expect(result.status).toBe('sent');
      expect(mockClient.sendTransacEmail).toHaveBeenCalled();
      
      // Verify the email was sent without attachments
      const sendOptions = mockClient.sendTransacEmail.mock.calls[0][0];
      expect(sendOptions.Attachments).toBeUndefined();
    });

    test('should handle attachment processing error gracefully', async () => {
      // Mock fetchAttachments to return invalid attachment data
      brevoService.fetchAttachments = jest.fn().mockResolvedValue([
        { base64: null, name: 'invalid.pdf', type: 'application/pdf' }
      ]);
      
      const result = await brevoService.sendNotification('order.placed', mockEventData, {});
      
      expect(result.status).toBe('sent');
      expect(mockClient.sendTransacEmail).toHaveBeenCalled();
    });
  });

  describe('Configuration checks', () => {
    test('should respect PDF disabled configuration', async () => {
      brevoService.options_.pdf = { enabled: false };
      
      const attachments = await brevoService.fetchAttachments('order.placed', {}, {
        createInvoice: jest.fn()
      });
      
      expect(attachments).toEqual([]);
    });

    test('should handle missing PDF configuration', async () => {
      delete brevoService.options_.pdf;
      
      const attachments = await brevoService.fetchAttachments('order.placed', {}, {
        createInvoice: jest.fn()
      });
      
      expect(attachments).toEqual([]);
    });

    test('should handle undefined PDF enabled setting', async () => {
      brevoService.options_.pdf = {}; // enabled is undefined
      
      const attachments = await brevoService.fetchAttachments('order.placed', {}, {
        createInvoice: jest.fn()
      });
      
      expect(attachments).toEqual([]);
    });
  });
});