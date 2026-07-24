import UnifiedMediaFrame from "@/components/UnifiedMediaFrame";

type Props = { space: string; title: string };

/** In-page English storage: pictures, documents, files + nested folders. */
export default function EnglishResourcePanel({ space, title }: Props) {
  const base = space === "hub" ? "/english" : `/english/${space}`;
  return (
    <UnifiedMediaFrame
      alsoShow={["document", "folder"]}
      folderArea="english"
      spaceKey={space}
      spaceBasePath={base}
      title={title}
      collapsedByDefault={false}
    />
  );
}
