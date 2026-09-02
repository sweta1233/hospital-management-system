import React, { useRef, useEffect } from 'react'

/**
 * Flipkart / Amazon Style 6-Digit Discrete OTP Input Box
 * Supports auto-focus, paste distribution, backspace navigation, arrow keys, and auto-submit.
 */
export default function DiscreteOtpInput({
  value = '',
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true
}) {
  const inputRefs = useRef([])
  const digits = Array(6).fill('')

  // Split current value into 6 slots
  for (let i = 0; i < 6; i++) {
    digits[i] = value[i] || ''
  }

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleInputChange = (e, index) => {
    const val = e.target.value
    const cleaned = val.replace(/\D/g, '')

    if (!cleaned) {
      // Empty or non-digit typed
      const newDigits = [...digits]
      newDigits[index] = ''
      const newCode = newDigits.join('')
      onChange(newCode)
      return
    }

    // Single digit entry
    const char = cleaned.slice(-1)
    const newDigits = [...digits]
    newDigits[index] = char
    const newCode = newDigits.join('')
    onChange(newCode)

    // Move to next input box if available
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
      inputRefs.current[index + 1].select()
    }

    // If all 6 digits filled, trigger onComplete
    if (newCode.length === 6 && onComplete) {
      onComplete(newCode)
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        // Current box empty, navigate back and clear previous
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
        inputRefs.current[index - 1].focus()
        e.preventDefault()
      } else if (digits[index]) {
        // Clear current box
        const newDigits = [...digits]
        newDigits[index] = ''
        onChange(newDigits.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus()
    } else if (e.key === 'ArrowRight' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6)

    if (digitsOnly) {
      onChange(digitsOnly)
      // Focus appropriate input box
      const targetIndex = Math.min(digitsOnly.length, 5)
      if (inputRefs.current[targetIndex]) {
        inputRefs.current[targetIndex].focus()
      }
      if (digitsOnly.length === 6 && onComplete) {
        onComplete(digitsOnly)
      }
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-3">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleInputChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`otp-digit-input ${digit ? 'filled ring-2 ring-emerald-500/40' : ''}`}
          autoComplete="one-time-code"
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  )
}
