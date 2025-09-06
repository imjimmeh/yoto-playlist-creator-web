export const selectFiles = (options: {
  multiple: boolean;
  accept: string;
}): Promise<File[]> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = options.multiple;
    input.accept = options.accept;

    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      resolve(files ? Array.from(files) : []);
    };

    input.click();
  });
};

export const selectImageFile = (): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file || null);
    };

    input.click();
  });
};
