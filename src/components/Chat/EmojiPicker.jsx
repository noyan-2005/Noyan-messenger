import EmojiPicker from "emoji-picker-react";

export default function ChatEmojiPicker({
    onEmojiClick,
}) {
    return (
        <EmojiPicker 
            onEmojiClick={onEmojiClick}
            theme="light"
            width={320}
            height={420}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
                showPreview : false ,
            }}
            
            />
    );
}