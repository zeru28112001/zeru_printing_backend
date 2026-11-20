import { PipeTransform, BadRequestException } from '@nestjs/common';

export class ParseBooleanPipe implements PipeTransform<string> {
  private readonly valueName: string;

  constructor(valueName: string = 'value') {
    this.valueName = valueName;
  }

  transform(value: any): any {
    const errorMessage = `Invalid ${this.valueName} value, ${this.valueName} must be 'true', 'false', '1', or '0'`;

    try {
      if (value === undefined || value === null) {
        return value;
      }

      const stringValue = String(value).toLowerCase().trim();

      if (stringValue === 'true' || stringValue === '1') {
        return true;
      }

      if (stringValue === 'false' || stringValue === '0') {
        return false;
      }

      throw new Error(errorMessage);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
