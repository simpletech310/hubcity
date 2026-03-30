import { forwardRef } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: boolean;
  glow?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, padding = true, glow = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-card rounded-2xl border border-border-subtle overflow-hidden
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
