import { PipeTransform, BadRequestException } from '@nestjs/common';
import { isNumber } from 'class-validator';

export class ParseNumberPipe implements PipeTransform<number> {
  private readonly valueName: string;

  constructor(valueName: string = 'value') {
    this.valueName = valueName;
  }

  transform(value: any): any {
    const errorMessage = `Invalid ${this.valueName} value, ${this.valueName} must be number`;
    try {
      if (value === undefined || value === null) {
        return value;
      }

      if (!isNumber(Number(value))) {
        throw new Error(errorMessage);
      }

      return Number(value);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
