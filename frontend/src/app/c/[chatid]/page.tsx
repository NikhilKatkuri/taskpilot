import PromptBox from "@/components/PromptBox";
import Sidebar from "@/components/Sidebar";


export default function Chat() {
  const noop = () => {};

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background font-sans">
      <div className="flex h-full flex-col overflow-hidden md:flex-row">
        <Sidebar
          chats={[]}
          selectedChatId={null}
          profileName={null}
          profileEmail={null}
          onLogout={noop}
          onCreateChat={noop}
          onSelectChat={noop}
          onDeleteChat={noop}
        />
        <div className="flex h-full w-full flex-1 overflow-hidden px-3 py-4 md:px-6 md:py-5">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden">
            <div className="flex h-full flex-col items-center justify-center gap-6 px-2 pb-12">
              <h1 className="text-center text-4xl font-medium tracking-tight text-foreground">What can I help with?</h1>
              <div className="w-full max-w-2xl">
                <PromptBox />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
