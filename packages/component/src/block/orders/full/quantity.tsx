import { useContext, useEffect, useRef, useState } from "react";
import { API, OrderSide, OrderStatus } from "@orderly.network/types";
import { Check, X } from "lucide-react";
import { cn } from "@/utils/css";
import { Popover, PopoverAnchor, PopoverContent } from "@/popover";
import { commify } from "@orderly.network/utils";
import { useSymbolContext } from "@/provider/symbolProvider";
import Button from "@/button";
import { OrderListContext } from "../shared/orderListContext";
import { toast } from "@/toast";

export const OrderQuantity = (props: { order: API.OrderExt }) => {
  const { order } = props;

  const [quantity, setQuantity] = useState<string>(order.quantity.toString());
  const { editOrder } = useContext(OrderListContext);

  const [open, setOpen] = useState(0);
  const [editting, setEditting] = useState(false);

  const closePopover = () => setOpen(0);
  const cancelPopover = () => setOpen(-1);

  const boxRef = useRef<HTMLDivElement>(null);
  const { base } = useSymbolContext();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      // close the input when click outside of boxRef
      const el = boxRef?.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      setEditting(false);
    };

    document.body.addEventListener("click", clickHandler);

    return () => {
      document.body.removeEventListener("click", clickHandler);
    };
  }, []);

  const onClick = (event: MouseEvent) => {
    // event.stopPropagation();
    // event.preventDefault();
    setEditting(false);
    if (Number(quantity) === Number(order.quantity)) {
      return;
    }
    setOpen(true);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const onConfirm = () => {
    setIsSubmitting(true);
    editOrder(order.order_id, {
      order_price: order.price,
      order_quantity: quantity,
      symbol: order.symbol,
      order_type: order.type,
      side: order.side,
      reduce_only: Boolean(order.reduce_only),
    })
      .then(
        (result) => {
          closePopover();
          // setTimeout(() => inputRef.current?.blur(), 300);
        },
        (err) => {
          toast.error(err.message);
          setQuantity(order.quantity.toString());
          cancelPopover();
        }
      )
      .finally(() => setIsSubmitting(false));
  };

  return (
    <Popover
      open={open > 0}
      onOpenChange={(open: boolean) => setOpen(open ? 1 : 0)}
    >
      <div
        className={cn(
          "orderly-flex orderly-justify-start orderly-items-center orderly-gap-1 orderly-relative orderly-font-semibold",
          {
            "orderly-text-trade-profit": order.side === OrderSide.BUY,
            "orderly-text-trade-loss": order.side === OrderSide.SELL,
          }
        )}
        ref={boxRef}
      >
        <span>{order.executed}</span>
        <span>/</span>
        <PopoverAnchor asChild>
          {order.status === OrderStatus.NEW ? (
            <input
              ref={inputRef}
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onFocus={() => setEditting(true)}
              className="orderly-w-0 orderly-flex-1 orderly-bg-base-700 orderly-px-2 orderly-py-1 orderly-rounded focus-visible:orderly-outline-1 focus-visible:orderly-outline-primary-light focus-visible:orderly-outline focus-visible:orderly-ring-0"
            />
          ) : (
            <span>{quantity}</span>
          )}
        </PopoverAnchor>
        <div
          className={cn("orderly-absolute orderly-right-1 orderly-flex", {
            "orderly-animate-in orderly-fade-in orderly-zoom-in": editting,
            "orderly-animate-out orderly-fade-out orderly-zoom-out  orderly-hidden":
              !editting,
          })}
        >
          <button
            className="hover:orderly-bg-base-contrast/10 orderly-rounded orderly-px-1 orderly-text-base-contrast-54 hover:orderly-text-base-contrast-80"
            onClick={onClick}
          >
            <Check size={18} />
          </button>

          <PopoverContent
            align="end"
            side="top"
            className="orderly-w-[340px]"
            onCloseAutoFocus={(e) => {
              if (inputRef.current && open === -1) {
                inputRef.current.focus();
              }
            }}
          >
            <div className="orderly-pt-5 orderly-relative">
              <div className="orderly-text-base-contrast-54 orderly-text-2xs desktop:orderly-text-sm">
                You agree changing the quantity of {base}-PERP order to{" "}
                <span className="orderly-text-warning">
                  {commify(quantity)}
                </span>
                .
              </div>
              <div className="orderly-grid orderly-grid-cols-2 orderly-gap-2 orderly-mt-5">
                <Button
                  color="tertiary"
                  onClick={cancelPopover}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button loading={isSubmitting} onClick={onConfirm}>
                  Confirm
                </Button>
              </div>
              <button
                className="orderly-absolute orderly-right-0 orderly-top-0 orderly-text-base-contrast-54"
                onClick={cancelPopover}
              >
                <X size={18} />
              </button>
            </div>
          </PopoverContent>
        </div>
      </div>
    </Popover>
  );
};