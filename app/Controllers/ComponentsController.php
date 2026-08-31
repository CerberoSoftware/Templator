<?php
declare(strict_types=1);

namespace Et\Controllers;

use Et\Core\Request;
use Et\Core\Response;
use Et\Repos\ComponentRepository;

final class ComponentsController
{
    public function index(): void
    {
        Response::ok((new ComponentRepository())->all());
    }

    public function store(Request $req): void
    {
        $name = $req->string('name');
        $category = $req->string('category');
        $htmlTemplate = $req->string('html_template');
        if ($name === '' || $htmlTemplate === '') {
            Response::error(400, 'name and html_template are required', 'invalid');
        }
        $propsSchema = $req->input('props_schema');
        $id = (new ComponentRepository())->create(
            mb_substr($name, 0, 190),
            mb_substr($category !== '' ? $category : 'Custom', 0, 50),
            $htmlTemplate,
            is_string($propsSchema) ? $propsSchema : null
        );
        Response::ok(['id' => $id]);
    }

    public function destroy(Request $req, array $params): void
    {
        (new ComponentRepository())->delete((int) $params['id']);
        Response::ok();
    }
}
