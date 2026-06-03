import { NextResponse } from 'next/server';
import { dbMock } from '../../../../lib/dbMock';

export async function POST(request: Request) {
  try {
    // 1. Structured JSON Payload Parsing inside Try/Catch
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload in request body.' },
        { status: 400 }
      );
    }

    // 2. Extract Fields
    const {
      name,
      email,
      phone,
      preferenceFood,
      preferenceVibe,
      qualifierAnswer,
      selectedDate,
      telemetry,
      aiPlanId,
    } = body;

    // 3. Robust Input Validation Verification Routines
    const errors: string[] = [];

    // Name validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name is required and must be at least 2 characters long.');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      errors.push('A valid email address is required.');
    }

    // Phone validation (simple international format regex: numbers, spaces, plus, dashes, parens)
    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    if (!phone || typeof phone !== 'string' || !phoneRegex.test(phone.trim())) {
      errors.push('A valid contact phone number is required (7-20 digits).');
    }

    // Selections validation
    if (!preferenceFood || typeof preferenceFood !== 'string' || preferenceFood.trim().length === 0) {
      errors.push('Food preference is required.');
    }
    if (!preferenceVibe || typeof preferenceVibe !== 'string' || preferenceVibe.trim().length === 0) {
      errors.push('Vibe preference is required.');
    }
    if (!qualifierAnswer || typeof qualifierAnswer !== 'string' || qualifierAnswer.trim().length === 0) {
      errors.push('Qualifier answer is required.');
    }

    // Date validation
    let parsedDate: Date | null = null;
    if (!selectedDate) {
      errors.push('Selected date and time is required.');
    } else {
      parsedDate = new Date(selectedDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push('Selected date must be a valid ISO date string.');
      }
    }

    // Telemetry validation (matching the json model rules)
    if (!telemetry || typeof telemetry !== 'object') {
      errors.push('Telemetry object is required.');
    } else {
      const { evadeAttempts, timeSpent, deviceType, cursorPath, velocityVectors } = telemetry;

      if (typeof evadeAttempts !== 'number' || evadeAttempts < 0) {
        errors.push('Telemetry: evadeAttempts must be a non-negative number.');
      }

      if (typeof timeSpent !== 'number' || timeSpent < 0) {
        errors.push('Telemetry: timeSpent must be a non-negative number.');
      }

      if (!deviceType || typeof deviceType !== 'string' || deviceType.trim().length === 0) {
        errors.push('Telemetry: deviceType is required.');
      }

      // Check complex behavioral tracking arrays
      if (cursorPath !== undefined) {
        if (!Array.isArray(cursorPath)) {
          errors.push('Telemetry: cursorPath must be an array.');
        } else {
          for (let i = 0; i < cursorPath.length; i++) {
            const point = cursorPath[i];
            if (!point || typeof point !== 'object' || typeof point.x !== 'number' || typeof point.y !== 'number' || typeof point.t !== 'number') {
              errors.push(`Telemetry: cursorPath[${i}] must have numeric x, y, and t coordinates.`);
              break; // only report the first format error to prevent spamming
            }
          }
        }
      }

      if (velocityVectors !== undefined) {
        if (!Array.isArray(velocityVectors)) {
          errors.push('Telemetry: velocityVectors must be an array.');
        } else {
          for (let i = 0; i < velocityVectors.length; i++) {
            if (typeof velocityVectors[i] !== 'number') {
              errors.push(`Telemetry: velocityVectors[${i}] must be a number.`);
              break;
            }
          }
        }
      }
    }

    // Check if any validation errors accumulated
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed for lead payload.',
          errors,
        },
        { status: 400 }
      );
    }

    // 4. Save to persistent Mock DB Store
    const savedLead = await dbMock.saveLead({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      preferenceFood: preferenceFood.trim(),
      preferenceVibe: preferenceVibe.trim(),
      qualifierAnswer: qualifierAnswer.trim(),
      selectedDate: parsedDate!.toISOString(),
      telemetry: {
        evadeAttempts: telemetry.evadeAttempts,
        timeSpent: telemetry.timeSpent,
        deviceType: telemetry.deviceType.trim(),
        cursorPath: telemetry.cursorPath || [],
        velocityVectors: telemetry.velocityVectors || [],
      },
      aiPlanId: aiPlanId ? String(aiPlanId).trim() : null,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lead successfully captured and registered.',
        leadId: savedLead.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Unhandled error in lead capture route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected internal server error occurred while processing your request.',
        error: error.message || 'Unknown Error',
      },
      { status: 500 }
    );
  }
}

// Optionally handle OPTIONS requests for preflight checks
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
