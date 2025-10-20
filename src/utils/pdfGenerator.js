import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Company/Branch details
const COMPANY_INFO = {
  name: "SmartAgro Solutions",
  address: "Northern University, Kantharmadam, Sri Lanka",
  phone: "+94 76 942 3167",
  email: "info@smartagro.lk",
  website: "www.smartagro.lk",
  registrationNo: "PV 12345-2024"
};

export const generateCostEstimationPDF = async (request, costEstimate, currency = 'USD') => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    // Currency formatting function (kept for backward compatibility)
    // const formatCurrency = (amount) => {
    //   if (currency === 'LKR') {
    //     return `LKR ${amount?.toFixed(2) || '0.00'}`;
    //   } else {
    //     return `$${amount?.toFixed(2) || '0.00'}`;
    //   }
    // };

    // Dual currency formatting function - admin sends LKR, convert to USD for display
    const formatDualCurrency = (lkrAmount) => {
      const usdAmount = lkrAmount / 303.62; // Convert LKR to USD
      return `$${usdAmount?.toFixed(2) || '0.00'} / LKR ${lkrAmount?.toFixed(2) || '0.00'}`;
    };

    // Helper function to add text with word wrapping
    const addText = (text, x, y, options = {}) => {
      const { fontSize = 10, fontStyle = 'normal', maxWidth = pageWidth - 40, align = 'left' } = options;
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      
      if (align === 'center') {
        pdf.text(text, pageWidth / 2, y, { align: 'center' });
      } else if (align === 'right') {
        pdf.text(text, pageWidth - 20, y, { align: 'right' });
      } else {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * (fontSize * 0.4));
      }
      return y + (fontSize * 0.4);
    };

    // Header Section
    pdf.setFillColor(34, 197, 94); // Green color
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    addText(COMPANY_INFO.name, 20, 15, { fontSize: 18, fontStyle: 'bold' });
    addText('Cost Estimation Report', 20, 30, { fontSize: 14 });
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPosition = 60;

    // Company Information Section
    pdf.setFillColor(248, 250, 252);
    pdf.rect(20, yPosition - 5, pageWidth - 40, 35, 'F');
    
    yPosition = addText('Company Information', 25, yPosition + 5, { fontSize: 12, fontStyle: 'bold' });
    yPosition = addText(`Address: ${COMPANY_INFO.address}`, 25, yPosition + 5, { fontSize: 9 });
    yPosition = addText(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, 25, yPosition + 3, { fontSize: 9 });
    yPosition = addText(`Website: ${COMPANY_INFO.website} | Reg. No: ${COMPANY_INFO.registrationNo}`, 25, yPosition + 3, { fontSize: 9 });
    
    yPosition += 15;

    // Customer Information Section
    yPosition = addText('Customer Information', 20, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 5;
    
    const customerInfo = [
      `Name: ${request.fullName || 'N/A'}`,
      `Email: ${request.email || 'N/A'}`,
      `Phone: ${request.mobileNumber || 'N/A'}`,
      `Address: ${request.address || 'N/A'}`,
      `NIC: ${request.nicNumber || 'N/A'}`
    ];
    
    customerInfo.forEach(info => {
      yPosition = addText(info, 20, yPosition, { fontSize: 10 });
      yPosition += 2;
    });
    
    yPosition += 10;

    // Farm Information Section
    yPosition = addText('Farm Information', 20, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 5;
    
    const farmInfo = [
      `Farm Name: ${request.farmName || 'N/A'}`,
      `Farm Size: ${request.farmSize || 'N/A'} acres`,
      `Location: ${request.farmLocation || 'N/A'}`,
      `Soil Type: ${request.soilType || 'N/A'}`
    ];
    
    farmInfo.forEach(info => {
      yPosition = addText(info, 20, yPosition, { fontSize: 10 });
      yPosition += 2;
    });
    
    yPosition += 10;

    // Selected Parameters Section
    if (request.selectedParameters && request.selectedParameters.length > 0) {
      yPosition = addText('Selected Device Parameters', 20, yPosition, { fontSize: 12, fontStyle: 'bold' });
      yPosition += 5;
      
      const parameterNames = {
        soilMoisture: 'Soil Moisture Sensor',
        airHumidity: 'Air Humidity Sensor',
        airTemperature: 'Air Temperature Sensor',
        soilTemperature: 'Soil Temperature Sensor',
        rainDetection: 'Rain Detection Sensor',
        lightLevel: 'Light Level Sensor (LDR)',
        airQuality: 'Air Quality Sensor (MQ135)',
        waterPumpControl: 'Water Pump Relay Control'
      };
      
      request.selectedParameters.forEach(param => {
        const paramName = parameterNames[param] || param;
        yPosition = addText(`• ${paramName}`, 25, yPosition, { fontSize: 10 });
        yPosition += 2;
      });
      
      yPosition += 10;
    }

    // Check if we need a new page for cost breakdown
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = 20;
    }

    // Cost Breakdown Section
    pdf.setFillColor(34, 197, 94);
    pdf.rect(20, yPosition - 5, pageWidth - 40, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    addText('Cost Breakdown', 25, yPosition, { fontSize: 12, fontStyle: 'bold' });
    pdf.setTextColor(0, 0, 0);
    yPosition += 15;

    // Debug: Log the cost estimate structure
    console.log('🔍 PDF Generator - Cost Estimate Data:', costEstimate);
    
    // Use the original LKR values (admin sends LKR, we convert to USD for display)
    // If LKR values are not found, use the USD values as LKR (since admin entered LKR but they were stored as USD)
    const deviceCostLKR = costEstimate.deviceCostLKR || costEstimate.deviceCost || 0;
    const serviceChargeLKR = costEstimate.serviceChargeLKR || costEstimate.serviceCharge || 0;
    const deliveryChargeLKR = costEstimate.deliveryLKR || costEstimate.delivery || 0;
    
    console.log('🔍 PDF Generator - LKR Values:', {
      deviceCostLKR,
      serviceChargeLKR,
      deliveryChargeLKR
    });
    
    const costs = [
      ['Device Cost', formatDualCurrency(deviceCostLKR)],
      ['Service Charge', formatDualCurrency(serviceChargeLKR)],
      ['Delivery Charge', formatDualCurrency(deliveryChargeLKR)]
    ];
    
    costs.forEach(([label, amount]) => {
      pdf.setFont('helvetica', 'normal');
      addText(label, 25, yPosition, { fontSize: 10 });
      pdf.setFont('helvetica', 'bold');
      addText(amount, pageWidth - 60, yPosition, { fontSize: 10 });
      yPosition += 12; // Increased spacing
    });
    
    // Check if we need a new page for total cost
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Total line
    pdf.setLineWidth(0.5);
    pdf.line(25, yPosition, pageWidth - 25, yPosition);
    yPosition += 15; // Increased spacing
    
    const totalCostLKR = deviceCostLKR + serviceChargeLKR + deliveryChargeLKR;
    pdf.setFont('helvetica', 'bold');
    addText('Total Cost', 25, yPosition, { fontSize: 12 });
    addText(formatDualCurrency(totalCostLKR), pageWidth - 60, yPosition, { fontSize: 12 });
    
    yPosition += 10;
    
    // Exchange rate note
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    addText('Exchange Rate: 1 USD = 303.62 LKR (approximate)', 25, yPosition, { fontSize: 8 });
    
    yPosition += 20;

    // Additional Notes
    if (costEstimate.notes) {
      yPosition = addText('Additional Notes', 20, yPosition, { fontSize: 12, fontStyle: 'bold' });
      yPosition += 5;
      yPosition = addText(costEstimate.notes, 20, yPosition, { fontSize: 10, maxWidth: pageWidth - 40 });
      yPosition += 10;
    }

    // Generate QR Code data with both USD and LKR values
    const qrData = {
      requestId: request.id,
      customerName: request.fullName,
      farmName: request.farmName,
      totalCost: totalCostLKR.toFixed(2),
      totalCostUSD: (totalCostLKR / 303.62).toFixed(2),
      deviceCost: deviceCostLKR.toFixed(2),
      deviceCostUSD: (deviceCostLKR / 303.62).toFixed(2),
      serviceCharge: serviceChargeLKR.toFixed(2),
      serviceChargeUSD: (serviceChargeLKR / 303.62).toFixed(2),
      deliveryCharge: deliveryChargeLKR.toFixed(2),
      deliveryChargeUSD: (deliveryChargeLKR / 303.62).toFixed(2),
      estimateDate: new Date().toISOString().split('T')[0],
      company: COMPANY_INFO.name,
      contactPhone: COMPANY_INFO.phone,
      notes: costEstimate.notes || ''
    };

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Add QR code to PDF
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    
    addText('QR Code for Mobile Access', 20, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 10;
    pdf.addImage(qrCodeDataURL, 'PNG', 20, yPosition, 40, 40);
    addText('Scan with your mobile device\nto view cost estimation details', 70, yPosition + 10, { fontSize: 9 });

    // Footer
    const footerY = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    addText(`Generated on: ${new Date().toLocaleDateString()} | Request ID: ${request.id}`, 20, footerY, { fontSize: 8 });
    addText(`Page 1 of 1`, pageWidth - 40, footerY, { fontSize: 8 });

    return {
      pdf,
      qrData,
      filename: `cost-estimation-${request.id}-${new Date().toISOString().split('T')[0]}.pdf`
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

export const downloadPDF = (pdf, filename) => {
  try {
    pdf.save(filename);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF: ' + error.message);
  }
};
