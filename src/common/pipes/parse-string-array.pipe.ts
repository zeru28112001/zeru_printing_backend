import { PipeTransform, BadRequestException } from '@nestjs/common';

export class ParseStringArrayPipe implements PipeTransform<
  string | string[],
  string[]
> {
  private readonly valueName: string;
  private readonly allowedValues?: string[];

  constructor(
    valueName: string = 'value',
    allowedValues?: string[],
  ) {
    this.valueName = valueName;
    this.allowedValues = allowedValues;
  }

  transform(value: any): string[] {
    try {
      if (value === undefined || value === null) {
        return value;
      }

      let parsedValue: string[];

      if (Array.isArray(value)) {
        parsedValue = value;
      } else if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          parsedValue = Array.isArray(parsed) ? parsed : [value];
        } catch {
          parsedValue = value.split(',').map((item) => item.trim());
        }
      } else {
        throw new Error(
          `Invalid ${this.valueName} value, ${this.valueName} must be an array of strings or comma-separated string`,
        );
      }

      if (this.allowedValues) {
        for (const item of parsedValue) {
          if (!this.allowedValues.includes(item)) {
            throw new Error(
              `Invalid ${this.valueName} value '${item}', allowed values are: ${this.allowedValues.join(', ')}`,
            );
          }
        }
      }

      return parsedValue;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
