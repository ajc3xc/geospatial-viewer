import * as vscode from 'vscode';
import * as path from 'path';
import { readFileSync } from 'fs';
import * as GeoTIFF from 'geotiff';
import ogr2ogr from 'ogr2ogr';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('geo-preview.showPreview', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const filePath = editor.document.uri.fsPath;
                const ext = path.extname(filePath).toLowerCase();
                if (ext === '.gpkg') {
                    showGpkgPreview(filePath);
                } else if (ext === '.tif' || ext === '.tiff') {
                    showTiffPreview(filePath);
                } else {
                    vscode.window.showErrorMessage('Unsupported file type.');
                }
            }
        })
    );
}

async function showGpkgPreview(filePath: string) {
    try {
        const ogr = ogr2ogr(filePath);
        ogr.exec((err: any, data: any) => {
            if (err) {
                vscode.window.showErrorMessage('Failed to convert GeoPackage to GeoJSON: ' + err.message);
                return;
            }

            const panel = vscode.window.createWebviewPanel(
                'geoPreview',
                'GeoPackage Preview',
                vscode.ViewColumn.One,
                {}
            );

            panel.webview.html = `<html><body><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
        });
    } catch (error) {
        const errorMessage = (error as Error).message;
        vscode.window.showErrorMessage('An error occurred: ' + errorMessage);
    }
}

async function showTiffPreview(filePath: string) {
    try {
        const arrayBuffer = readFileSync(filePath).buffer;
        
        // Initialize GeoTIFF without web workers
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);

        const image = await tiff.getImage();
        const data = await image.readRasters();

        const panel = vscode.window.createWebviewPanel(
            'geoPreview',
            'TIFF Preview',
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = `<html><body><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
    } catch (error) {
        const errorMessage = (error as Error).message;
        vscode.window.showErrorMessage('An error occurred: ' + errorMessage);
    }
}

export function deactivate() {}
