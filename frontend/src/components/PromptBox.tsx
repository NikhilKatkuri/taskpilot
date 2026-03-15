"use client"

import React, { useState } from 'react'
import { Paperclip, Mic, ArrowUp, Zap, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface PromptBoxProps {
      onSend?: (message: string) => void
      onMic?: () => void
      disabled?: boolean
}

const PromptBox = ({ onSend, onMic, disabled = false }: PromptBoxProps) => {
      const [input, setInput] = useState<string>("")

      const handleSend = () => {
            const message = input.trim()
            if (!message || disabled) return

            onSend?.(message)
            setInput("")
      }

      return (
            <div className="w-full relative shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] rounded-full bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 transition-all focus-within:ring-2 focus-within:ring-zinc-200 dark:focus-within:ring-zinc-700">
                  <div className="flex items-center px-4 py-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full">
                              <Paperclip className="h-5 w-5" />
                        </Button>
                        <Textarea
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder="What do you want to know?"
                              className="min-h-[24px] max-h-[200px] w-full resize-none border-0 bg-transparent py-3 px-3 text-[16px] shadow-none outline-none focus-visible:ring-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 overflow-hidden leading-relaxed"
                              onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault()
                                          handleSend()
                                    }
                              }}
                              rows={1}
                              style={{ height: "auto", overflowY: "auto" }}
                              onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                              }}
                        />
                        <div className="flex items-center gap-1 shrink-0 ml-2">

                              <Button onClick={onMic} variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full shrink-0">
                                    <Mic className="h-5 w-5" />
                              </Button>
                              <Button
                                    onClick={handleSend}
                                    disabled={disabled || !input.trim()}
                                    size="icon"
                                    className="h-10 w-10 bg-black dark:bg-white text-white dark:text-black rounded-full shrink-0 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed ml-1 transition-colors"
                              >
                                    <ArrowUp className="h-5 w-5" />
                              </Button>
                        </div>
                  </div>
            </div>
      )
}

export default PromptBox