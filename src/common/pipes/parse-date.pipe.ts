import { PipeTransform, BadRequestException } from '@nestjs/common';

export class ParseDatePipe implements PipeTransform<string> {
  private readonly valueName: string;

  constructor(valueName: string = 'value') {
    this.valueName = valueName;
  }

  transform(value: any): any {
    if (value === undefined || value === null) {
      return value;
    }

    const parsedDate = new Date(value);

    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        `Invalid ${this.valueName} value, ${this.valueName} must be a valid date`,
      );
    }

    return parsedDate;
  }
}
