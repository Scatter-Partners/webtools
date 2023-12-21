import re
import requests

def download_and_update_scripts(html_file):
    """Downloads external scripts from an HTML file and updates the links to be local."""

    with open(html_file, 'r') as file:
        html_content = file.read()

    # Extract script URLs using a regular expression
    script_urls = re.findall(r'<script src="(.*?)"></script>', html_content)

    for url in script_urls:
        # Extract filename from URL
        filename = url.split('/')[-1]

        # Skip the constants.js file
        if filename == 'constants.js':
            continue

        try:
            # Download the script
            response = requests.get(url)
            response.raise_for_status()  # Raise an exception for non-200 status codes

            with open(filename, 'wb') as f:
                f.write(response.content)

            # Update the link in the HTML content
            html_content = html_content.replace(url, filename)

        except requests.exceptions.RequestException as e:
            print(f"Error downloading {url}: {e}")

    with open(html_file, 'w') as file:
        file.write(html_content)

html_file = 'group.html'  # Replace with the actual HTML file path
download_and_update_scripts(html_file)
