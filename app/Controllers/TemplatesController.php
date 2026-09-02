<?php
declare(strict_types=1);

namespace Et\Controllers;

use Et\Core\Request;
use Et\Core\Response;
use Et\Repos\TemplateRepository;
use Et\Repos\VersionRepository;

final class TemplatesController
{
    public function index(): void
    {
        Response::ok((new TemplateRepository())->all());
    }

    public function store(Request $req): void
    {
        $name = $req->string('name');
        if ($name === '') {
            $name = 'Untitled template';
        }
        $json = $req->input('json_structure');
        $html = $req->input('final_html');
        $id = (new TemplateRepository())->create(
            mb_substr($name, 0, 190),
            is_string($json) ? $json : null,
            is_string($html) ? $html : null
        );
        Response::ok(['id' => $id]);
    }

    public function show(Request $req, array $params): void
    {
        $template = (new TemplateRepository())->find((int) $params['id']);
        if ($template === null) {
            Response::error(404, 'Template not found', 'not_found');
        }
        Response::ok($template);
    }

    public function update(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        $repo = new TemplateRepository();
        $existing = $repo->find($id);
        if ($existing === null) {
            Response::error(404, 'Template not found', 'not_found');
        }

        $name = $req->string('name');
        if ($name === '') {
            $name = (string) $existing['name'];
        }
        $json = $req->input('json_structure');
        $html = $req->input('final_html');
        $jsonStructure = is_string($json) ? $json : (string) ($existing['json_structure'] ?? '');
        $finalHtml = is_string($html) ? $html : (string) ($existing['final_html'] ?? '');

        $repo->update($id, mb_substr($name, 0, 190), $jsonStructure, $finalHtml);

        $label = $req->string('snapshot_label');
        (new VersionRepository())->snapshot($id, $jsonStructure, $finalHtml, $label !== '' ? mb_substr($label, 0, 190) : 'Autosave');

        Response::ok(['id' => $id, 'saved_at' => date('c')]);
    }

    public function destroy(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        $repo = new TemplateRepository();
        $template = $repo->find($id);
        if ($template === null) {
            Response::error(404, 'Template not found', 'not_found');
        }
        if ((bool) $template['locked']) {
            Response::error(409, 'Template is locked. Unlock it before deleting.', 'locked');
        }
        $repo->softDelete($id);
        Response::ok();
    }

    public function lock(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        $repo = new TemplateRepository();
        if ($repo->find($id) === null) {
            Response::error(404, 'Template not found', 'not_found');
        }
        $repo->setLocked($id, (bool) $req->input('locked', true));
        Response::ok();
    }

    public function trash(): void
    {
        Response::ok((new TemplateRepository())->trashed());
    }

    public function restoreFromTrash(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        $repo = new TemplateRepository();
        if ($repo->findTrashed($id) === null) {
            Response::error(404, 'Template not found in recycle bin', 'not_found');
        }
        $repo->restore($id);
        Response::ok();
    }

    public function purge(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        $repo = new TemplateRepository();
        if ($repo->findTrashed($id) === null) {
            Response::error(404, 'Template not found in recycle bin', 'not_found');
        }
        $repo->delete($id);
        Response::ok();
    }

    public function versions(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        if ((new TemplateRepository())->find($id) === null) {
            Response::error(404, 'Template not found', 'not_found');
        }
        Response::ok((new VersionRepository())->listFor($id));
    }

    public function version(Request $req, array $params): void
    {
        $templateId = (int) $params['id'];
        $version = (new VersionRepository())->find($templateId, (int) $params['version']);
        if ($version === null) {
            Response::error(404, 'Version not found', 'not_found');
        }
        Response::ok($version);
    }

    public function snapshot(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        $template = (new TemplateRepository())->find($id);
        if ($template === null) {
            Response::error(404, 'Template not found', 'not_found');
        }
        $label = $req->string('label');
        $versionId = (new VersionRepository())->snapshot(
            $id,
            (string) ($template['json_structure'] ?? ''),
            (string) ($template['final_html'] ?? ''),
            $label !== '' ? mb_substr($label, 0, 190) : 'Manual snapshot'
        );
        Response::ok(['id' => $versionId]);
    }

    public function restore(Request $req, array $params): void
    {
        $templateId = (int) $params['id'];
        $versionId = (int) $params['version'];
        $templates = new TemplateRepository();
        $versions = new VersionRepository();

        $template = $templates->find($templateId);
        if ($template === null) {
            Response::error(404, 'Template not found', 'not_found');
        }
        $version = $versions->find($templateId, $versionId);
        if ($version === null) {
            Response::error(404, 'Version not found', 'not_found');
        }

        $versions->snapshot(
            $templateId,
            (string) ($template['json_structure'] ?? ''),
            (string) ($template['final_html'] ?? ''),
            'Pre-restore backup'
        );
        $templates->update(
            $templateId,
            (string) $template['name'],
            (string) ($version['json_structure'] ?? ''),
            (string) ($version['final_html'] ?? '')
        );
        Response::ok(['id' => $templateId]);
    }
}
