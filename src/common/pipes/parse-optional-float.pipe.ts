import { BadRequestException, PipeTransform } from '@nestjs/common';

/**
 * Parses an optional float query/param value.
 * - missing or empty string (`undefined`, `null`, `''`) → `undefined`
 * - a valid numeric string → the parsed `number`
 * - any other non-numeric string → `400 Bad Request`
 */
export class ParseOptionalFloatPipe
  implements PipeTransform<string | undefined, number | undefined>
{
  private readonly valueName: string;

  constructor(valueName: string = 'value') {
    this.valueName = valueName;
  }

  transform(value?: string): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(
        `Invalid ${this.valueName} value, ${this.valueName} must be a number`,
      );
    }

    return parsed;
  }
}

