import { JSX } from 'solid-js';
import styles from './pageLayout.module.css';

interface MonitorLink {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
}

interface MonitorMenuProps {
  links: MonitorLink[];
}

export const MonitorMenu = (props: MonitorMenuProps): JSX.Element => {
  return (
    <div style={{
      "display": "flex",
      "gap": "12px",
      "padding": "16px",
      "border": "1px solid #e0e0e0",
      "border-radius": "4px",
      "background-color": "#fafafa",
      "margin-bottom": "20px"
    }}>
      {props.links.map((link) => (
        <a
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noopener noreferrer" : undefined}
          style={{
            "text-decoration": "none",
            "color": "#2196F3",
            "font-size": "16px",
            "font-weight": "500",
            "cursor": "pointer",
            "transition": "color 0.2s",
            "display": "flex",
            "align-items": "center",
            "gap": "8px",
            "padding": "8px 12px",
            "border-radius": "4px",
            "transition": "background-color 0.2s, color 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "#1976D2";
            e.currentTarget.style.backgroundColor = "#e3f2fd";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "#2196F3";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span style={{ "font-size": "18px" }}>{link.icon}</span>
          {link.label}
        </a>
      ))}
    </div>
  );
};
