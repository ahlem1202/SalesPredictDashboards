import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeCurrencySymbol'
})
export class RemoveCurrencySymbolPipe implements PipeTransform {
  transform(value: number): string {
    return value.toFixed(2); // Adjust decimal places as needed
  }
}
