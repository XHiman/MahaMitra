import React from "react";
import "./Button.css";

type ButtonSize = "xs" | "s" | "m" | "l" | "xl" | "custom";
type ButtonColor = "main" | "sec" | "highlight" | "custom";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  color?: ButtonColor;
  customSizeClass?: string;
  customColorClass?: string;
}

const sizeMap: Record<ButtonSize, string> = {
  xs: "btn-xs",
  s: "btn-s",
  m: "btn-m",
  l: "btn-l",
  xl: "btn-xl",
  custom: "",
};

const colorMap: Record<ButtonColor, string> = {
  main: "btn-main",
  sec: "btn-sec",
  highlight: "btn-highlight",
  custom: "",
};

export const Button = React.memo(
  ({
    size = "m",
    color = "main",
    customSizeClass = "",
    customColorClass = "",
    className = "",
    children,
    ...props
  }: ButtonProps) => {
    const classes = [
      "btn-base",
      sizeMap[size],
      colorMap[color],
      customSizeClass,
      customColorClass,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button {...props} className={classes}>
        {children}
      </button>
    );
  }
);
