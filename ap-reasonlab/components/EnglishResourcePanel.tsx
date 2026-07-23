import UploadAndShow from "@/components/UploadAndShow";

type Props = { space: string; title: string };

export default function EnglishResourcePanel({ space, title }: Props) {
  return (
    <UploadAndShow
      alsoShow={["document", "folder"]}
      folderArea="english"
      spaceKey={space}
      spaceBasePath={`/english/${space}`}
      title={title}
      collapsedByDefault
    />
  );
}

