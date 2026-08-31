import os
import zipfile


def zip_directory(folder_path, output_zip_path):
    """Zips all files and subdirectories inside `folder_path` into `output_zip_path`."""
    with zipfile.ZipFile(output_zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                # Calculate relative path to preserve folder structure inside the zip archive
                arcname = os.path.relpath(file_path, start=folder_path)
                zipf.write(file_path, arcname)


if __name__ == "__main__":
    # Specify your project directory and desired output filename
    source_folder = "./MathQuizGame"  # Replace with your folder path
    output_filename = "MathQuizGame.zip"  # Output archive name

    zip_directory(source_folder, output_filename)
    print(f"Successfully created {output_filename}")