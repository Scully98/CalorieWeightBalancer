Pod::Spec.new do |s|
  s.name           = 'WidgetFile'
  s.version        = '1.0.0'
  s.summary        = 'Writes the widget data as a file into the App Group container'
  s.description    = 'Excluded from backup, readable while the device is locked after the first unlock.'
  s.author         = ''
  s.homepage       = 'https://github.com/Scully98/CalorieWeightBalancer'
  s.platform       = :ios, '16.4'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
