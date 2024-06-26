export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  role?: string;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'dash-admin',
        title: 'Home',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard-admin',
        icon: 'ti ti-home',
        breadcrumbs: false,
        role: 'admin'
      },
      {
        id: 'dash-manager',
        title: 'Home',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard-manager',
        icon: 'ti ti-home',
        breadcrumbs: false,
        role: 'manager'
      },
      {
        id: 'dash-employee',
        title: 'Home',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard-employee',
        icon: 'ti ti-home',
        breadcrumbs: false,
        role: 'employee'
      },
      {
        id: 'register',
        title: 'Create Account',
        type: 'item',
        classes: 'nav-item',
        url: '/create-account',
        icon: 'ti ti-user-plus',
        target: true,
        breadcrumbs: false,
        role: 'admin'
      },
      {
        id: 'base',
        title: 'Create DataBase',
        type: 'item',
        classes: 'nav-item',
        url: '/create-database',
        icon: 'ti ti-database',
        target: true,
        breadcrumbs: false,
        role: 'admin'
      },
      {
        id: 'upload-data',
        title: 'Upload DataBase',
        type: 'item',
        classes: 'nav-item',
        url: '/upload-data',
        icon: 'ti ti-refresh',
        target: true,
        breadcrumbs: false,
        role: 'manager'
      }
    ]
  },
  {
    id: 'elements',
    title: 'UI Components',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'typography',
        title: 'Typography',
        type: 'item',
        classes: 'nav-item',
        url: '/typography',
        icon: 'ti ti-typography'
      },
      {
        id: 'card',
        title: 'Card',
        type: 'item',
        classes: 'nav-item',
        url: '/card',
        icon: 'ti ti-credit-card'
      },
      {
        id: 'breadcrumb',
        title: 'Breadcrumb',
        type: 'item',
        classes: 'nav-item',
        url: '/breadcrumb',
        icon: 'ti ti-hierarchy-2'
      },
      {
        id: 'spinner',
        title: 'spinner',
        type: 'item',
        classes: 'nav-item',
        url: '/spinner',
        icon: 'ti ti-loader'
      },
      {
        id: 'color',
        title: 'Colors',
        type: 'item',
        classes: 'nav-item',
        url: '/color',
        icon: 'ti ti-brush'
      },
      {
        id: 'tabler',
        title: 'Tabler',
        type: 'item',
        classes: 'nav-item',
        url: 'https://tabler-icons.io/',
        icon: 'ti ti-leaf',
        target: true,
        external: true
      },
      {
        id: 'sample-page',
        title: 'Sample Page',
        type: 'item',
        url: '/sample-page',
        classes: 'nav-item',
        icon: 'ti ti-brand-chrome'
      }
    ]
  }
];
