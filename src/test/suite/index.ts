import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';
import * as vscode from 'vscode';

import MDBExtensionController from '../../mdbExtensionController';
import { TestExtensionContext } from './stubs';

export function run(): Promise<void> {
  const reporterOptions = {
    spec: '-',
    'mocha-junit-reporter': path.resolve(__dirname, './test-results.xml')
  };

  // Create the mocha tester.
  const mocha = new Mocha({
    reporter: 'mocha-multi',
    reporterOptions,
    ui: 'tdd'
  });
  mocha.useColors(true);

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      // Activate the extension.
      const mockExtensionContext = new TestExtensionContext();

      const mockMDBExtension = new MDBExtensionController(mockExtensionContext);
      mockMDBExtension.activate(mockExtensionContext);

      // Disable the dialogue for prompting the user where to store the connection.
      vscode.workspace.getConfiguration('mdb.connectionSaving').update(
        'hideOptionToChooseWhereToSaveNewConnections',
        true
      ).then(() => {
        // Add files to the test suite.
        files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

        try {
          // Run the mocha test.
          mocha.run(failures => {
            if (failures > 0) {
              e(new Error(`${failures} tests failed.`));
            } else {
              c();
            }
          });
        } catch (mochaRunErr) {
          e(mochaRunErr);
        }
      });
    });
  });
}
