import { PipeTransform, BadRequestException } from '@nestjs/common';

export class ParseNumberArrayPipe implements PipeTransform<number[]> {
  private readonly valueName: string;

  constructor(valueName: string = 'value') {
    this.valueName = valueName;
  }

  transform(value: any): any {
    try {
      if (value === undefined || value === null) {
        return value;
      }
      const parsedValue = Array.isArray(value) ? value : JSON.parse(value);
      if (!Array.isArray(parsedValue)) {
        throw new Error(
          `Invalid ${this.valueName} value, ${this.valueName} must be an array of numbers`,
        );
      }
      return parsedValue.map((item) => {
        const num = Number(item);
        if (isNaN(num)) {
          throw new Error(
            `Invalid ${this.valueName} value, ${this.valueName} must be an array of numbers`,
          );
        }
        return num;
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
