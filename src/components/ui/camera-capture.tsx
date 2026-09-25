"use client";

import { Camera } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  className?: string;
  disabled?: boolean;
}

export function CameraCapture({
  onCapture,
  className,
  disabled,
}: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onCapture(e.target.files[0]);
      }
      // Reset input so the same file can be captured again if needed
      e.target.value = "";
    },
    [onCapture],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="camera-input"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className={className}
        disabled={disabled}
      >
        <Camera className="size-4 mr-2" />
        Tirar Foto
      </Button>
    </>
  );
}
