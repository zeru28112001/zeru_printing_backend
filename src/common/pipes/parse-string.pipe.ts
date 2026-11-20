import { PipeTransform, BadRequestException } from '@nestjs/common';

export class ParseStringPipe implements PipeTransform<string> {
  private readonly valueName: string;
  private readonly allowedValues?: string[];

  constructor(
    valueName: string = 'value',
    allowedValues?: string[],
  ) {
    this.valueName = valueName;
    this.allowedValues = allowedValues;
  }

  transform(value: any): any {
    try {
      if (value === undefined || value === null) {
        return value;
      }

      if (this.allowedValues && !this.allowedValues.includes(value)) {
        const errorMessage = `Invalid ${this.valueName} value, ${this.valueName} must be one of the following values: ${this.allowedValues.join(', ')}`;
        throw new Error(errorMessage);
      }

      return value;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
