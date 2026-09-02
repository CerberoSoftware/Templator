<?php
declare(strict_types=1);

namespace Et\Controllers;

use Et\Core\Request;
use Et\Core\Response;
use Et\Repos\QuickstartRepository;
use Et\Repos\TemplateRepository;

final class QuickstartController
{
    public function index(): void
    {
        Response::ok((new QuickstartRepository())->all());
    }

    public function store(Request $req): void
    {
        $templateId = $req->int('template_id');
        if ($templateId <= 0) {
            Response::error(400, 'template_id is required', 'invalid');
        }
        $template = (new TemplateRepository())->find($templateId);
        if ($template === null) {
            Response::error(404, 'Template not found', 'not_found');
        }
        $jsonStructure = (string) ($template['json_structure'] ?? '');
        if ($jsonStructure === '') {
            Response::error(400, 'Template has no content to add yet', 'empty_template');
        }

        $category = $req->string('category');
        $description = $req->string('description');

        $id = (new QuickstartRepository())->create(
            (string) $template['name'],
            mb_substr($description, 0, 500),
            mb_substr($category !== '' ? $category : 'Custom', 0, 50),
            $jsonStructure,
            false
        );
        Response::ok(['id' => $id]);
    }

    public function lock(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        $repo = new QuickstartRepository();
        if ($repo->find($id) === null) {
            Response::error(404, 'Quickstart template not found', 'not_found');
        }
        $repo->setLocked($id, (bool) $req->input('locked', true));
        Response::ok();
    }

    public function destroy(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        $repo = new QuickstartRepository();
        $template = $repo->find($id);
        if ($template === null) {
            Response::error(404, 'Quickstart template not found', 'not_found');
        }
        if ((bool) $template['locked']) {
            Response::error(409, 'Quickstart template is locked. Unlock it before deleting.', 'locked');
        }
        $repo->delete($id);
        Response::ok();
    }
}
