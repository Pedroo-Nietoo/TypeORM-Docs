# TypeORM Docs

![Project Banner](https://raw.githubusercontent.com/Pedroo-Nietoo/TypeORM-Docs/refs/heads/main/images/project_image.png)

## Overview

The `typeorm-docs` is a simple command-line tool that generates HTML and Markdown documentation for your TypeORM entities. This package reads your entities located on the `src/entities` folder and produces an easy-to-read documentation format for your models and their fields, including attributes like `id`, `type`, `primary and foreign keys`, and `relations`.


<br>

## Usage

### Installation

To install `typeorm-docs`, use npm:

```bash
npm install typeorm-docs
```

Or, if you prefer to install it globally:

```bash
npm install -g typeorm-docs
```

### Generating Documentation
Once installed, you can generate documentation by running the following command:

```bash
npx typeorm-docs
```

Or, if you prefer to generate the documentation on dark mode:

```bash
npx typeorm-docs -d
```

This will create an `index.html` file in the `docs` directory, containing the generated documentation from your `src/entities` folder.

To use `typeorm-docs`, ensure you have your TypeORM entities in the `src/entities` directory of your project. The command will look for the entities and generate the documentation based on their content.

<br>

## Contributing
Contributions are welcome! If you would like to contribute, please fork the repository, add your changes, and submit a pull request. Please ensure your code adheres to the project's coding standards and includes tests. Make sure to send a detailed description of your changes and why you made them, as long as a image/gif/video that shows the changes.

<br>

## Testing
To run tests for the package, you can use Jest. First, ensure you have installed the dependencies, then run:

```bash
npm test
```

<br>

## License
This package is licensed under the MIT License. See the LICENSE file for more details.


© 2024 [Pedroo-Nietoo](https://github.com/Pedroo-Nietoo)