import { forwardRef } from "react";

type CardVariant = "default" | "glass" | "glass-elevated" | "glass-neon";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: boolean;
  glow?: boolean;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-card border border-border-subtle",
  glass: "glass-card border border-border-subtle glass-inner-light",
  "glass-elevated": "glass-card-elevated glass-inner-light",
  "glass-neon": "glass-neon glass-inner-light",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, padding = true, glow = false, variant = "default", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          ${variantClasses[variant]} rounded-2xl overflow-hidden
          transition-all duration-300
          ${hover ? "hover:border-gold/20 hover:bg-card-hover cursor-pointer press card-glow" : ""}
          ${padding ? "p-4" : ""}
          ${glow ? "glow-gold-sm border-gold/15" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
export default Card;
