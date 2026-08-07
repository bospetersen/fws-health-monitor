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
      "padding": "10px",
      "border": "1px solid #e0e0e0",
      "border-radius": "4px",
      "background-color": "#ffffff",
      "margin-bottom": "20px",
      "margin-top": "-30px"
    }}>
      {props.links.map((link) => (
        <a
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noopener noreferrer" : undefined}
          style={{
            "text-decoration": "none",
            "color": "#999999",
            "font-size": "16px",
            "font-weight": "normal",
            "cursor": "pointer",
            "transition": "color 0.2s",
            "display": "flex",
            "align-items": "center",
            "gap": "8px",
            "padding": "8px 12px",
            "border-radius": "4px"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "#000000";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "#999999";
          }}
        >
          <span style={{ "font-size": "18px" }}>{link.icon}</span>
          {link.label}
        </a>
      ))}
    </div>
  );
};
