// navigation.service.ts
import { Injectable } from '@angular/core';
import { NavigationItem, NavigationItems } from '../app/theme/layouts/admin/navigation/navigation';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor() {}

  getFilteredNavigationItems(role: string): NavigationItem[] {
    return this.filterItems(NavigationItems, role);
  }

  private filterItems(items: NavigationItem[], role: string): NavigationItem[] {
    return items
      .filter(item => !item.role || item.role === role)
      .map(item => ({
        ...item,
        children: item.children ? this.filterItems(item.children, role) : []
      }));
  }
}
