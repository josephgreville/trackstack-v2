function Icon({ children, size = 20, className = '', filled = false, ...props }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function IconHome(props) {
  return (
    <Icon {...props}>
      <path d="M3.5 10.8 12 3.5l8.5 7.3" />
      <path d="M5.5 9.3v10.2h13V9.3" />
      <path d="M9.7 19.5v-5.2h4.6v5.2" />
    </Icon>
  );
}

export function IconCompass(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.6 8.4-2 5.2-5.2 2 2-5.2 5.2-2Z" />
    </Icon>
  );
}

export function IconCollection(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 4v16M11 8h5M11 12h5M11 16h3" />
    </Icon>
  );
}

export function IconDisc(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v3.2M21 12h-3.2M12 21v-3.2M3 12h3.2" />
    </Icon>
  );
}

export function IconPlus(props) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconClose(props) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

export function IconMenu(props) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function IconChevronDown(props) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function IconChevronLeft(props) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function IconChevronRight(props) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function IconArrowRight(props) {
  return (
    <Icon {...props}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </Icon>
  );
}

export function IconArrowUpRight(props) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </Icon>
  );
}

export function IconMore(props) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconPencil(props) {
  return (
    <Icon {...props}>
      <path d="M4 20h4.2L19 9.2a2.1 2.1 0 0 0-3-3L5.2 17 4 20Z" />
      <path d="m14.8 7.4 2.8 2.8" />
    </Icon>
  );
}

export function IconTrash(props) {
  return (
    <Icon {...props}>
      <path d="M4.5 7h15M9 7V4.8h6V7M7 7l.8 12.2h8.4L17 7" />
      <path d="M10 11v4.8M14 11v4.8" />
    </Icon>
  );
}

export function IconCheck(props) {
  return (
    <Icon {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Icon>
  );
}

export function IconAlert(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 21 20H3L12 3.5Z" />
      <path d="M12 9v5M12 17.2v.1" />
    </Icon>
  );
}

export function IconInfo(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.1" />
    </Icon>
  );
}

export function IconMusic(props) {
  return (
    <Icon {...props}>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </Icon>
  );
}

export function IconClock(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.3 2" />
    </Icon>
  );
}

export function IconCalendar(props) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" />
    </Icon>
  );
}

export function IconUser(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-4 3.3-6 7-6s6.2 2 7 6" />
    </Icon>
  );
}

export function IconLogout(props) {
  return (
    <Icon {...props}>
      <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
      <path d="M14 8l4 4-4 4M8 12h10" />
    </Icon>
  );
}

export function IconSort(props) {
  return (
    <Icon {...props}>
      <path d="M8 4v16M5 17l3 3 3-3M16 20V4M13 7l3-3 3 3" />
    </Icon>
  );
}

export function IconEye(props) {
  return (
    <Icon {...props}>
      <path d="M2.8 12S6 6.5 12 6.5 21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.7" />
    </Icon>
  );
}

export function IconEyeOff(props) {
  return (
    <Icon {...props}>
      <path d="M3 3l18 18" />
      <path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c6 0 9.2 7 9.2 7a16 16 0 0 1-2.2 3.1M6.2 6.8C3.9 8.6 2.8 12 2.8 12S6 19 12 19a9.7 9.7 0 0 0 4.1-.9" />
      <path d="M10.2 10.3a2.5 2.5 0 0 0 3.5 3.5" />
    </Icon>
  );
}

export function IconSliders(props) {
  return (
    <Icon {...props}>
      <path d="M4 7h10M18 7h2M4 17h3M11 17h9" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </Icon>
  );
}

export function IconGrid(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" />
    </Icon>
  );
}

export function IconTape(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <circle cx="8" cy="12" r="2.2" />
      <circle cx="16" cy="12" r="2.2" />
      <path d="M10.2 12h3.6M6 18l1.2-3.8M18 18l-1.2-3.8" />
    </Icon>
  );
}

export function IconSpark(props) {
  return (
    <Icon {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </Icon>
  );
}
